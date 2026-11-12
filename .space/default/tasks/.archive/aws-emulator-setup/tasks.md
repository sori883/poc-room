<!-- koto Tasks による自動出力 -->

# AWS Emulatorのローカル実験環境を追加する

- タスク ID `aws-emulator-setup`
- 状態 完了（completed）
- 試行 1
- 版 17
- 更新日時 2026-11-12T04:46:10.841Z

## 内容

AWS EmulatorとCDK環境を追加済み。追加依頼はCDKのソース変更だけで更新デプロイが失敗するケースの実測。RDS縮小は未実装エラーでrollbackとなったため、EBS縮小、S3 Object Lockバケットのversioning停止、DynamoDB複数GSI追加などへ検証を広げる。各ケースの正常初回デプロイ、synth、更新結果、実リソースとロールバックを確認し、AWS制約・未実装・誤った成功を区別する。手動変更や外部障害注入なし。ポート9300で隔離し後片付けする。root=/Users/const/sori883/poc-room、project=default、branch=codex/aws-emulator-setup、PR \#2、実AWSは操作しない。

## 完了結果

ユーザーの承認によりPR https://github.com/sori883/poc-room/pull/2 を2026-11-12 13:45 JSTにmainへマージ。merge commit fe2a5d518f9a5c15ea9c84e1b8ce9b474990d9de、検証対象head 13e4c514a8aed12c6834cc4aea20c80595c55d29。マージ後のaws-emulatorコードが検証済みheadと同一であることを確認。公式Docker版、CLI/CDK基本操作、6種類の更新失敗と対照実験、検証環境の削除を実測済み。GitHub上のCIチェックは未設定。RDS/EBS等の未実装やObject Lockの再現不足はREADME・証拠に記録し、実AWS互換性やデータ保全の保証とは区別した。ローカルmainも同期済み。
