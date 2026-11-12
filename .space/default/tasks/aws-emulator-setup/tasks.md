<!-- koto Tasks による自動出力 -->

# AWS Emulatorのローカル実験環境を追加する

- タスク ID `aws-emulator-setup`
- 状態 待ち（waiting）
- 試行 1
- 版 15
- 更新日時 2026-11-12T03:44:16.211Z

## 内容

AWS EmulatorとCDK環境を追加済み。追加依頼はCDKのソース変更だけで更新デプロイが失敗するケースの実測。RDS縮小は未実装エラーでrollbackとなったため、EBS縮小、S3 Object Lockバケットのversioning停止、DynamoDB複数GSI追加などへ検証を広げる。各ケースの正常初回デプロイ、synth、更新結果、実リソースとロールバックを確認し、AWS制約・未実装・誤った成功を区別する。手動変更や外部障害注入なし。ポート9300で隔離し後片付けする。root=/Users/const/sori883/poc-room、project=default、branch=codex/aws-emulator-setup、PR \#2、実AWSは操作しない。

## 理由

CDKソース変更のみの6ケースを実測し、証拠と再現用アプリをPR \#2へ反映済み。固定名テーブルのID変更で名前衝突とロールバックを確認。RDS/EBS/DynamoDBの一部は未実装、S3 Object Lockは再現不足と判定。対照実験、構文・記録照合、全リソース削除と9300停止を確認。mainは未マージ。

## 次の操作

PR \#2のレビューとマージを確認する。実AWSの容量縮小制約・Object Lock・データ保全は今回の結果では保証しない。
