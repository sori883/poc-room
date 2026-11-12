# AWS Emulator セットアップの検証

2026-11-12、`codex/aws-emulator-setup` のローカル変更を検証した。

## 構成

AWS公式のDocker手順を再利用し、既存の `meta-astryx/` と並ぶ `aws-emulator/` に配置した。公式手順のLinuxパッケージからイメージを構築し、Composeで起動・停止を管理する。macOSではネイティブ実行がサポートされないためDockerを選んだ。独自のAWS API実装やLocalStackは追加していない。

接続用のPythonコマンドは、証明書を検証した健康確認後にAWS専用の環境変数を設定し、子プロセスを実行する。実行時ファイルはリポジトリ内の `.runtime/` に限定する。サービス別のコンテナは不要で、1つのエミュレーター内で複数のAWSサービスを扱う。

## 環境

- macOS / Apple Silicon
- Docker Engine 28.4.0、Compose v2.39.4-desktop.1
- AWS CLI 2.38.3
- AWS Emulator 1.0.322、release date 2026.11.10、commit `7753983c6e495ec3612695b1336bf4936fc7b7fd`
- Python 3.13

## 確認結果

| 確認 | 結果 |
| --- | --- |
| 公式ArmパッケージからのDockerビルド | 成功 |
| `./emulator up` | HTTPS応答とSTSアカウント `000000000000` を確認 |
| `./emulator demo` | S3のファイル内容、DynamoDBの項目、SQSの本文・MessageIdが一致 |
| サンプルの再実行 | 全サービスで成功 |
| サンプルの後片付け | バケット、テーブル、キューの一覧が空であることを確認 |
| 起動の再実行 | 既存のコンテナを使用し、検証用バケットを保持 |
| 停止と再起動 | コンテナと認証ファイルが削除され、再起動後はバケット一覧が空 |
| 停止中の `status` / `aws` / `run` | 非ゼロで終了し、子コマンドを実行しない |
| 親のAWS設定との分離 | 偽のアクセスキー、トークン、存在しないprofile、サービス固有endpoint、endpoint無視設定を渡してもローカルアカウントへ接続 |
| 別ポート9300 | 起動、全サンプル、停止に成功。9297とは別のコンテナ・認証情報 |
| `run` | 呼び出し元の作業ディレクトリを維持し、AWS・Node.js用の証明書設定を渡す |
| 公開先・メモリ制限 | Dockerの実設定が127.0.0.1、メモリ・swap合計各2147483648 bytes |
| 認証・テレメトリー | 起動ログで認証有効、テレメトリー無効を確認 |
| 形式・機密ファイル | Python構文、Compose構文、実装差分の空白確認に合格。認証情報・証明書はGit管理外 |

DynamoDBの削除は非同期だったため、サンプルに削除完了待ちを追加し、一覧が空になるまでを再確認した。作業ディレクトリ確認ではmacOSの `/tmp` が `/private/tmp` へ解決されるため、文字列一致から同一ディレクトリの照合へ検証方法を修正した。実装の作業ディレクトリ変更は不要だった。

Memory CLIの形式検証は成功。CLIが生成した知識ファイルのYAMLキー3行に末尾空白があり、全差分の `git diff --check` は検出する。生成形式を手で変更せず保持した。実装ファイルとREADMEの空白確認は成功した。

## 限界と最終状態

Intel/AMD用のパッケージ選択は実装したが、実機検証はArmのみ。Node.js・Java等のSDKそのものは今回実行していない。すべてのAWSサービスやIAMポリシー評価の互換性を保証するものではない。

通常用の9297を起動した状態で引き渡す。検証用の9300は停止済み。PRとマージの実状態はTasksの成果物参照・状態に記録する。

## CDK対応の追加検証（2026-11-12）

`aws-emulator/cdk/` にCDKアプリを追加。標準のDefaultStackSynthesizerを使い、S3バケット、DynamoDBテーブル、SQSキューを `PocRoomEmulatorDemo` に定義した。既存の接続設定分離を `./emulator cdk` でも使用し、CDKアプリはHTTPSの127.0.0.1以外の接続設定を拒否する。

Node.js 24.22.1、CDK CLI 2.1148.1（fcf5e34）、aws-cdk-lib 2.276.0、constructs 10.8.1を使用。依存関係はpackage-lock.jsonで固定し、`npm ci --ignore-scripts --no-audit --no-fund` でも再インストールに成功した。

| 確認 | 結果 |
| --- | --- |
| `cdk synth` | 3リソース、削除方針Delete、3つのOutputsを生成 |
| 標準の `cdk bootstrap` | `CDKToolkit` がCREATE_COMPLETE、bootstrap version 33 |
| 標準の `cdk deploy` | テンプレートのS3アップロードとCloudFormationの変更セット実行を経て成功 |
| `cdk-test` | CloudFormation Outputsでリソースを特定し、S3内容、DynamoDB項目、SQS本文・MessageIdを照合して成功 |
| 検証の再実行 | 2回連続で成功。検証データを削除してスタックを保持 |
| 同一定義の再デプロイ | no changesで成功 |
| `cdk destroy --force` | スタック削除が成功し、バケット404、テーブルResourceNotFoundException、キューNonExistentQueueを確認 |
| 未デプロイ時の `cdk-test` | CloudFormationのdoes not existで失敗 |
| 別ポート9300 | bootstrap、deploy、3サービスの検証に成功。9297と異なる物理リソース名 |
| 停止中のポート9399 | CDK実行前の接続確認で拒否 |
| AWS接続設定なしのアプリ直接実行 | ローカル用コマンドを使うようエラーを返す |
| CLIオプション | `cdk --version` と `cdk --help` を転送 |
| 構文・生成物 | PythonとJavaScript構文、実装差分空白を確認。node_modulesとcdk.outはGit管理外 |

AWS EmulatorやCDK本体へのパッチ、独自のCloudFormation実装は不要だった。S3バケットを空にするLambdaカスタムリソースも追加していない。検証は自分で書き込んだデータだけを削除し、利用者が追加したS3オブジェクトはdestroy前に利用者が整理する。

Lambdaコード・コンテナイメージなどのアセットを持つアプリ、実際のAWSへのデプロイは未検証。通常用9297にはCDKスタックを再デプロイした状態で引き渡し、9300は停止する。PR #2を更新し、マージ待ちとして記録する。

## CDKの更新失敗の追加検証（2026-11-12）

同じAWS Emulator 1.0.322で、CDKのソース変更だけによる更新失敗を6ケース検証した。検証開始時には9297が停止していたため、その状態を保ち、9300に専用環境を起動した。手動でのリソース変更、障害注入、外部通知の抑止は行っていない。

詳細な結果と再現手順は `aws-emulator/cdk/update-failures/README.md`。実行ログ、生成したテンプレート、CloudFormationイベントとサービスAPI応答は [evidence/rds-rollback/](evidence/rds-rollback/) と [evidence/update-failures/](evidence/update-failures/) に保存した。

| ケース | 初回 / synth / 更新の終了コード | 結果 |
| --- | --- | --- |
| RDS 30→20 GiB | 0 / 0 / 1 | in-place更新のNotImplementedでUPDATE_ROLLBACK_COMPLETE。30 GiBと同じDbiResourceIdを保持 |
| EBS 30→20 GiB | 0 / 0 / 1 | in-place更新のNotImplementedでUPDATE_ROLLBACK_COMPLETE。30 GiBを保持 |
| DynamoDBのGSIを2個追加 | 0 / 0 / 1 | in-place更新のNotImplementedでUPDATE_ROLLBACK_COMPLETE。GSIは作成されない |
| 固定名DynamoDBの主キー変更 | 0 / 0 / 1 | in-place更新のNotImplementedでUPDATE_ROLLBACK_COMPLETE。主キーはid |
| S3 Object Lock指定バケットのversioning停止 | 0 / 0 / 0 | 初回の設定確認でObjectLockConfigurationNotFoundError。更新後はUPDATE_COMPLETE / Suspended。前提が再現されていない |
| 固定名DynamoDBのCDK ID変更 | 0 / 0 / 1 | RenamedTableがalready exists in stackでCREATE_FAILED。UPDATE_ROLLBACK_COMPLETE、元のTableIdとログ保存期間7日を確認 |

RDSのテンプレート差分はAllocatedStorageの30→20だけ。対照実験として30→40へ増やしても同じ未実装エラーになったため、実AWSの縮小制約を再現したとは判定していない。容量は30のままで、CloudFormationのテンプレートもロールバック後は30へ戻っている。

CDK ID変更のケースでは、LogsのUPDATE_COMPLETE、RenamedTableのCREATE_FAILED、UPDATE_ROLLBACK_IN_PROGRESS、Logsの再更新、UPDATE_ROLLBACK_COMPLETEの順序を記録した。APIで確認した最終retentionInDaysは7。更新中の一瞬の14日という値をポーリングで直接観測したわけではない。対照実験ではテーブルIDをTableに固定し、同じ保存期間変更を成功させ、UPDATE_COMPLETE、実値14日、初回と同じTableIdを確認した。失敗はログ設定変更ではなくテーブル名の衝突によるものと切り分けた。

S3の初回API記録の収集中にGetObjectLockConfigurationが非ゼロを返したため、その一括収集は途中で停止した。EBSの初回スナップショットだけが保存されている。S3のエラーは更新後にも個別に再確認して保存し、DynamoDBの他2ケースも更新後の実リソースとイベントを保存した。これら3ケースについて、保存していない初回API応答との全項目比較は行っていない。

生成テンプレート、イベント、API応答を照合するアサーションを実行し、記録した判定と一致した。両CDKアプリのJavaScript構文も確認した。通常の3サービスサンプルには変更を加えていない。

全6スタックをCDK destroyで削除した後、RDS・EBS・DynamoDB・CloudWatch Logsの一覧が空、S3はbootstrap用バケットだけであることを確認した。続けて9300を停止・削除した。ソースは初回用（update=false、RDS容量30）へ戻してある。実AWSへの操作とデータプレーンの耐久性検証は行っていない。
