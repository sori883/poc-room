---
type: knowledge
scope: dev
title: AWS Emulatorのローカル実験環境
description: aws-emulator/の起動方法、設定の分離、データ寿命、再検証の入口。
code_refs: 
  - aws-emulator/emulator
  - aws-emulator/compose.yaml
  - aws-emulator/examples/smoke.py
sources: 
  - resource: https://docs.aws.amazon.com/emulator/latest/userguide/getting-started-docker.html
  - resource: .space/default/tasks/aws-emulator-setup/verification.md
generated: 
  by: agent:codex
  at: 2026-11-12T00:40:24.288Z
---
# ローカル実験環境

`aws-emulator/` にAWS公式Docker版を配置している。`./emulator up` で起動し、`./emulator demo` でS3・DynamoDB・SQSの書き込みと読み出しを検証する。`./emulator aws ...` はAWS CLI、`./emulator run ...` は任意のアプリを専用設定で起動する。

既定の接続先は `https://127.0.0.1:9297`、リージョンは `us-east-1`。親のAWS環境変数を子プロセスから取り除き、専用の認証情報・config・証明書を渡す。ホストのAWS設定は書き換えない。認証情報と証明書は `.runtime/<port>/` に生成され、Git管理から除外される。起動前のコマンド実行は失敗する。

Composeはホストのloopbackにのみ公開し、認証とTLS検証を有効にする。テレメトリーは無効、メモリ上限は2 GiB。エミュレーターは状態をメモリに持つため、停止・再起動で実験リソースは消える。`up` の再実行だけなら起動済みコンテナと状態を保持する。

別の実験は `./emulator --port 9300 up` のようにポートを分ける。ホスト・コンテナ・エミュレーター内部のポートを一致させる。停止やAPI操作でも同じポートを指定する。サンプルは固有名のリソースを作って後片付けする。DynamoDBは非同期削除の完了まで待つ。

イメージは公式 `LTS/latest` から構築する。再ビルドで版が変わるため、更新後は `version` と `demo` で確認する。2026-11-12にApple Silicon、AWS Emulator 1.0.322、AWS CLI 2.38.3で実操作を確認した。Intel/AMDや他言語SDKの実行は未検証。具体的な手順は `aws-emulator/README.md`、実測記録はタスクのverification.mdにある。
