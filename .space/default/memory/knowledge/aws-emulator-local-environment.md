---
type: knowledge
scope: dev
title: AWS Emulatorのローカル実験環境
description: AWS EmulatorとCDKの起動・デプロイ・検証、設定の分離、データ寿命。
code_refs: 
  - aws-emulator/emulator
  - aws-emulator/compose.yaml
  - aws-emulator/examples/smoke.py
  - aws-emulator/cdk/app.mjs
  - aws-emulator/cdk/cdk.json
  - aws-emulator/cdk/verify.py
  - aws-emulator/cdk/rds-rollback/app.mjs
  - aws-emulator/cdk/update-failures/app.mjs
sources: 
  - resource: https://docs.aws.amazon.com/emulator/latest/userguide/getting-started-docker.html
  - resource: .space/default/tasks/aws-emulator-setup/verification.md
generated: 
  by: agent:codex
  at: 2026-11-12T03:42:15.017Z
---
# ローカル実験環境

`aws-emulator/` にAWS公式Docker版を配置している。`./emulator up` で起動し、`./emulator demo` でS3・DynamoDB・SQSの書き込みと読み出しを検証する。`./emulator aws ...` はAWS CLI、`./emulator run ...` は任意のアプリを専用設定で起動する。

既定の接続先は `https://127.0.0.1:9297`、リージョンは `us-east-1`。親のAWS環境変数を子プロセスから取り除き、専用の認証情報・config・証明書を渡す。ホストのAWS設定は書き換えない。認証情報と証明書は `.runtime/<port>/` に生成され、Git管理から除外される。起動前のコマンド実行は失敗する。

Composeはホストのloopbackにのみ公開し、認証とTLS検証を有効にする。テレメトリーは無効、メモリ上限は2 GiB。エミュレーターは状態をメモリに持つため、停止・再起動で実験リソースは消える。`up` の再実行だけなら起動済みコンテナと状態を保持する。

別の実験は `./emulator --port 9300 up` のようにポートを分ける。ホスト・コンテナ・エミュレーター内部のポートを一致させる。停止やAPI操作でも同じポートを指定する。サンプルは固有名のリソースを作って後片付けする。DynamoDBは非同期削除の完了まで待つ。

イメージは公式 `LTS/latest` から構築する。再ビルドで版が変わるため、更新後は `version` と `demo` で確認する。2026-11-12にApple Silicon、AWS Emulator 1.0.322、AWS CLI 2.38.3で実操作を確認した。Intel/AMDや他言語SDKの実行は未検証。具体的な手順は `aws-emulator/README.md`、実測記録はタスクのverification.mdにある。

## CDKのデプロイ

`cdk/` にCDK CLI 2.1148.1、aws-cdk-lib 2.276.0、constructs 10.8.1を固定したアプリがある。Node.js 22以上で `npm --prefix cdk ci` を実行して準備する。標準のDefaultStackSynthesizerを使い、本体へのパッチは不要。

`./emulator cdk bootstrap aws://000000000000/us-east-1`、`./emulator cdk deploy PocRoomEmulatorDemo --require-approval never` の順に実行する。S3バケット、DynamoDBテーブル、SQSキューが作成される。`./emulator cdk-test` はCloudFormation Outputsから物理リソースを取得してデータを往復し、自分の検証データだけを削除する。`./emulator cdk destroy PocRoomEmulatorDemo --force` はスタックを削除する。利用者がS3へ追加したファイルは自動削除しない。destroy後もCDKToolkitは残る。

停止・再起動するとCDKToolkitも消えるのでbootstrapからやり直す。別ポートでも全コマンドへ同じ --port を渡す。cdk.outは共有なのでCDK操作は順に実行する。アプリはアカウント000000000000とus-east-1に固定し、HTTPSの127.0.0.1以外の接続設定を拒否する。証明書は親コマンドで設定、テレメトリーはcdk.jsonで無効にする。

2026-11-12に標準bootstrap、deploy、no-changes再デプロイ、3サービスの読み書き、destroy後の物理リソース不存在を確認した。別ポート9300でも成功。Lambdaコード・コンテナイメージなどのアセットを持つアプリと実AWSは未検証。詳細は aws-emulator/cdk/README.md。

## CDK更新失敗の再現範囲

2026-11-12、AWS Emulator 1.0.322でCDKソースの変更だけによる更新失敗を6ケース実測した。cdk/update-failures/app.mjsは初回用のupdate=falseをtrueへ変えると各ケースを合成する。スタックを一つずつ指定して更新する。RDSのみcdk/rds-rollback/app.mjsのallocatedStorageを変更する。

固定名DynamoDBテーブルのCDK IDをTableからRenamedTableへ変えるケースは、既存テーブル名との衝突でCREATE_FAILED、スタックはUPDATE_ROLLBACK_COMPLETEになった。元のTableIdと、先行するログ設定の最終保存期間7日を確認。CDK IDを元のTableに固定した対照実験では、ログ保存期間14日への更新に成功した。ログの更新成功→テーブル作成失敗→ログのロールバックというイベントも保存している。

RDSとEBSの30→20 GiB、DynamoDBのGSI2個追加と主キー変更は、既存リソース更新のNotImplementedでロールバックした。実AWSのサービス制約の再現とは扱わない。RDSは30→40 GiBでも同じ未実装エラー。S3はObject LockをCDKで指定して初回成功したが設定取得APIがObjectLockConfigurationNotFoundErrorを返し、versioning停止は成功したため、この制約も検証できない。成功表示だけで指定した設定の再現を判断しない。

詳細はaws-emulator/cdk/update-failures/README.md、証拠はタスクのevidence/rds-rollbackとevidence/update-failures。検証はポート9300で隔離し、全6スタックの削除とサービス一覧での不存在を確認してから環境を停止した。実AWSの操作とデータ保全・停止時間の検証は対象外。
