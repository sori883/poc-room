# AWS Emulator

AWS公式のエミュレーターをローカルで動かす実験環境です。AWSアカウントなしで、AWS CLIやSDKから各サービスのAPIを試せます。

## 準備

- Docker Desktop（LinuxではDocker Engine）とDocker Compose v2
- AWS CLI v2（この環境では2.38.3を使用）
- Python 3.9以上。追加のPythonパッケージは不要です。

MacではDocker Desktopを起動してください。Apple SiliconとIntel/AMDの両方に対応するDockerfileです。

## 起動して試す

このREADMEがある `aws-emulator/` フォルダで実行します。

```sh
./emulator up
./emulator demo
```

初回はAWS公式のLTSパッケージをダウンロードしてイメージを作ります。起動後、HTTPSの応答とローカルアカウント `000000000000` を確認します。

`demo` はS3の保存・読み出し、DynamoDBの登録・取得、SQSの送受信を実行し、返された内容を照合します。成功すると各サービスに `PASS` が表示されます。サンプルが作ったリソースは実行後に削除されるため、繰り返し実行できます。

```sh
./emulator demo s3
./emulator demo dynamodb
./emulator demo sqs
```

## AWS CLIを使う

```sh
./emulator aws sts get-caller-identity
./emulator aws s3 mb s3://poc-room-assets
./emulator aws s3 ls
./emulator aws dynamodb list-tables
./emulator aws sqs list-queues
```

接続先は既定で `https://127.0.0.1:9297`、リージョンは `us-east-1` です。各サービスは同じエミュレーター内で動くので、サービスごとのコンテナは不要です。

コマンド実行時は、親のシェルにあるAWS関連の環境変数を子プロセスから取り除き、エミュレーター専用の接続先・認証情報・証明書を設定します。普段の `~/.aws/config` や `~/.aws/credentials` と親シェルの設定は変更しません。エミュレーターへ接続できない場合は、AWS CLIやアプリを起動する前に停止します。

## 自分のアプリを接続する

```sh
./emulator run python3 /path/to/app.py
./emulator run node /path/to/app.mjs
```

呼び出し元の作業ディレクトリを保ったまま実行します。PythonのBoto3とAWS CLIは `AWS_CA_BUNDLE`、Node.jsは `NODE_EXTRA_CA_CERTS` でローカル証明書を信頼します。Boto3やJavaScript SDKそのものはアプリ側で用意してください。

SDKやアプリで接続先・認証情報を直接指定すると、その設定が優先される場合があります。JavaScript v3でホスト名に接頭辞を付けるAPIを使う場合は、クライアントに `disableHostPrefix: true` も指定します。Java・Rust・.NETの証明書設定は[公式SDK接続手順](https://docs.aws.amazon.com/emulator/latest/userguide/point-sdk-to-emulator.html)を参照してください。

## 状態確認・停止・更新

```sh
./emulator status
./emulator version
./emulator logs
./emulator down
```

**停止すると、作成したバケット・テーブル・キューとそのデータは消えます。** エミュレーターはメモリ内で状態を持ち、永続化しません。

最新版へ更新するときは、停止してから再ビルドします。この操作でも実験データは消えます。

```sh
./emulator down
./emulator build
./emulator up
./emulator demo
```

`LTS/latest` を使うため、再ビルド時にはバージョンが変わることがあります。起動中のバージョンは `./emulator version` で確認できます。

## 別のポートで実験する

```sh
./emulator --port 9300 up
./emulator --port 9300 demo
./emulator --port 9300 down
```

同じポートを起動・操作・停止のすべてで指定します。環境変数 `AWS_EMULATOR_PORT=9300` でも指定できます。ポートごとにコンテナと認証情報を分け、Docker側とエミュレーター側のポート番号を一致させています。

## フォルダ構成

```text
aws-emulator/
├── Dockerfile          # 公式パッケージからイメージを作成
├── compose.yaml        # ローカル公開、メモリ上限、共有フォルダ
├── emulator            # 起動・停止・AWS CLI・アプリの実行
├── examples/
│   └── smoke.py        # S3・DynamoDB・SQSのAPIサンプル
└── .runtime/           # 実行時の認証情報と証明書（Git管理外）
```

公開先は自分のPCの `127.0.0.1` に限定し、認証と証明書の検証は有効です。テレメトリーは無効にしています。メモリ上限は公式手順と同じ2 GiBで、上限を超えてコンテナが停止すると実験データも失われます。

## うまく動かないとき

- Dockerに接続できない: Docker Desktopを起動し、`docker info` を確認します。
- ポートが使用中: `--port 9300` など、空いている番号を指定します。
- 起動に失敗する: `./emulator logs` で確認します。ポートを変えた場合は同じ `--port` を付けます。
- APIが501を返す: その操作は未実装です。サービスや操作によって対応範囲が異なります。

IAMポリシーの評価や、複数アカウント・複数リージョンをまたぐ動作は実際のAWSと異なります。この環境はローカルの機能確認用です。

## 公式ドキュメント

- [Getting started](https://docs.aws.amazon.com/emulator/latest/userguide/getting-started.html)
- [Dockerでの実行](https://docs.aws.amazon.com/emulator/latest/userguide/getting-started-docker.html)
- [SDKの接続設定](https://docs.aws.amazon.com/emulator/latest/userguide/point-sdk-to-emulator.html)
- [対応範囲の確認](https://docs.aws.amazon.com/emulator/latest/userguide/check-project.html)
- [テレメトリーの設定](https://docs.aws.amazon.com/emulator/latest/userguide/telemetry.html)
