<!-- koto Tasks による自動出力 -->

# AWS Emulatorのローカル実験環境を追加する

- タスク ID `aws-emulator-setup`
- 状態 待ち（waiting）
- 試行 1
- 版 10
- 更新日時 2026-11-12T01:05:49.152Z

## 内容

poc-room直下のaws-emulator/に公式Docker版とCLIサンプルを配置済み。追加依頼によりcdk/にS3・DynamoDB・SQSを定義し、ローカルへのCDK deploy、作成したリソースのAPI往復、CDK destroyと削除を実際に検証する。既存の接続設定分離と別ポート動作を保つ。管理root=/Users/const/sori883/poc-room、project=default、ブランチcodex/aws-emulator-setup、PR \#2、統合先origin/main。PRを更新し、マージ状態を実態どおり記録する。

## 理由

CDKサンプルを追加し、標準bootstrap・deploy・3サービスの操作・destroy後の削除、別ポートを実機検証済み。PR \#2のコードと説明を更新。9297にスタックを再デプロイ済み、9300は停止済み。mainは未マージ。

## 次の操作

PR \#2のレビューとマージを確認してから管理上の完了を記録する。
