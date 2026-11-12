<!-- koto Tasks による自動出力 -->

# AWS Emulatorのローカル実験環境を追加する

- タスク ID `aws-emulator-setup`
- 状態 待ち（waiting）
- 試行 1
- 版 6
- 更新日時 2026-11-12T00:42:49.075Z

## 内容

poc-room直下のaws-emulator/に公式Docker版の起動・停止・接続設定とS3/DynamoDB/SQSのサンプルを分離して追加する。実際に起動し、API操作、再実行、停止・再起動を検証する。管理root=/Users/const/sori883/poc-room、project=default、開始main、統合先origin/main。ローカル実装と検証を進め、PRとの紐付けとマージ状態は実態を記録する。

## 理由

専用フォルダへの実装と実機検証が完了し、Draft PR \#2を作成。mainへのマージは未実施。通常用9297は起動中、検証用9300は停止済み。

## 次の操作

PR \#2のレビューとマージを確認してから管理上の完了を記録する。
