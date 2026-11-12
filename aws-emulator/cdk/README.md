# CDKでローカルへデプロイする

S3バケット、DynamoDBテーブル、SQSキューをCDKで作成し、AWS Emulator上で操作するサンプルです。通常の `cdk bootstrap`・`cdk deploy`・`cdk destroy` を使用します。

## 初回の準備とデプロイ

Node.js 22以上とnpmを用意し、`aws-emulator/` フォルダで次を実行します。

```sh
npm --prefix cdk ci
./emulator up
./emulator cdk bootstrap aws://000000000000/us-east-1
./emulator cdk deploy PocRoomEmulatorDemo --require-approval never
./emulator cdk-test
```

`bootstrap` は、CDKが使うS3バケット・IAMロール・SSMパラメーターなどをローカルに準備します。`deploy` は `PocRoomEmulatorDemo` スタックを作成し、バケット名・テーブル名・キューURLを出力します。`cdk-test` で3サービスに `PASS` が表示されれば、作成したリソースでデータの往復を確認できています。

エミュレーターを停止するとCDK用の準備とスタックも消えるので、再起動後は `bootstrap` からやり直してください。依存パッケージのインストールは初回とlockfile更新時だけで構いません。

## 定義の変更・確認・削除

リソースの定義は [app.mjs](app.mjs) にあります。変更後も同じ `deploy` を使います。

```sh
./emulator cdk synth
./emulator cdk diff PocRoomEmulatorDemo
./emulator cdk deploy PocRoomEmulatorDemo --require-approval never
./emulator cdk-test
./emulator cdk destroy PocRoomEmulatorDemo --force
```

`--require-approval never` と `--force` は、このローカルサンプルの確認待ちを省く指定です。

このサンプルでは3リソースに削除方針 `DESTROY` を指定しています。`destroy` はテーブルやキュー内のデータも削除します。自分でS3にファイルを追加した場合は、先にそのファイルを削除してバケットを空にしてください。検証コマンドは、自分が作ったファイル・項目・メッセージだけを削除し、スタックを残します。

`destroy` 後も準備用の `CDKToolkit` スタックは残るため、続けて `deploy` できます。環境全体を片付ける場合は `./emulator down` で停止します。

## 接続先と別ポート

`./emulator cdk` は、このフォルダにインストールしたCDKを、選択したエミュレーターの接続設定で実行します。アプリのアカウントは `000000000000`、リージョンは `us-east-1` に固定しています。アプリはローカルの接続先が設定されていない実行を拒否します。認証設定と証明書は親の `emulator` コマンドが用意するため、グローバルなCDKのインストールや普段のAWS設定の変更は不要です。

出力されるキューURLは `amazonaws.com` 形式ですが、`./emulator aws` や `cdk-test` はローカルの接続先を指定して操作します。

```sh
./emulator --port 9300 up
./emulator --port 9300 cdk bootstrap aws://000000000000/us-east-1
./emulator --port 9300 cdk deploy PocRoomEmulatorDemo --require-approval never
./emulator --port 9300 cdk-test
./emulator --port 9300 down
```

合成結果の `cdk.out/` は共有されるので、複数ポートへのCDKコマンドは順番に実行してください。

## 構成と検証範囲

| ファイル | 役割 |
| --- | --- |
| `app.mjs` | 3リソースのCDK定義とCloudFormation Outputs |
| `cdk.json` | アプリの起動方法。CDKテレメトリーとバージョン情報の送信を無効化 |
| `package.json` / `package-lock.json` | CDK CLI・ライブラリのバージョンを固定 |
| `verify.py` | CloudFormation Outputsから実リソースを取得し、AWS CLIで内容を照合 |

Apple Silicon / AWS Emulator 1.0.322 / CDK CLI 2.1148.1 / aws-cdk-lib 2.276.0で、標準のbootstrap、デプロイ、再デプロイ、API操作、削除を確認しました。Lambdaコードやコンテナイメージなどのアセットを持つアプリは今回の対象外です。対応範囲は[公式の互換性説明](https://docs.aws.amazon.com/emulator/latest/userguide/fidelity.html)を確認してください。

通常のAWSへのデプロイの仕組みは[CDK公式ドキュメント](https://docs.aws.amazon.com/cdk/v2/guide/deploy.html)を参照してください。このサンプルの実行先はローカルです。

## 更新失敗とロールバックの実験

[更新デプロイの検証](update-failures/README.md)では、CDKのソース変更だけで失敗するケースを試せます。固定名テーブルのCDK ID変更による名前衝突とロールバックを確認しています。RDS・EBS・DynamoDBの一部の変更は未実装エラーとなり、S3 Object Lockには設定の再現不足があったため、実AWSの制約を確認できたケースと分けて記録しています。
