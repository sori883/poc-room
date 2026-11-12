<!-- koto Tasks による自動出力 -->

# AWS Emulatorのローカル実験環境を追加する

- タスク ID `aws-emulator-setup`
- 状態 作業中（running）
- 試行 1
- 版 14
- 更新日時 2026-11-12T03:42:35.330Z

## 内容

AWS EmulatorとCDK環境を追加済み。追加依頼はCDKのソース変更だけで更新デプロイが失敗するケースの実測。RDS縮小は未実装エラーでrollbackとなったため、EBS縮小、S3 Object Lockバケットのversioning停止、DynamoDB複数GSI追加などへ検証を広げる。各ケースの正常初回デプロイ、synth、更新結果、実リソースとロールバックを確認し、AWS制約・未実装・誤った成功を区別する。手動変更や外部障害注入なし。ポート9300で隔離し後片付けする。root=/Users/const/sori883/poc-room、project=default、branch=codex/aws-emulator-setup、PR \#2、実AWSは操作しない。

## 理由

追加依頼: CDK作成リソースを手動改名した後の再デプロイと失敗・復旧をローカルで検証する。既存サンプルと別スタックを使い、再現手順と実結果を残す。
