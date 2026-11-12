# CDKの更新デプロイで失敗するケース

CDKのソース変更だけで、初回は成功し、更新デプロイで失敗する構成を試します。手動でのリソース変更、通知の抑止、障害注入は使いません。各ケースは独立したスタックです。

AWS Emulator 1.0.322で、**固定名のDynamoDBテーブルのCDK IDを変更すると、名前の衝突で更新が失敗し、ロールバックする**ことを確認しました。一方、RDSやEBSの容量変更などはエミュレーターの未実装エラーでした。

## 確認できたこと

2026-11-12、Apple Silicon、CDK CLI 2.1148.1、aws-cdk-lib 2.276.0で実行しました。全6ケースで初回デプロイと更新用テンプレートの生成は成功しています。

| ケース | CDKで変更する内容 | 更新デプロイの実測 | 判定 |
| --- | --- | --- | --- |
| `PocRoomLogicalIdRename` | 固定名テーブルのIDを `Table` → `RenamedTable`。ログ保存期間を7日→14日 | `already exists in stack` で失敗し、`UPDATE_ROLLBACK_COMPLETE` | 名前衝突とロールバックを再現 |
| `PocRoomRdsRollback` | PostgreSQLの容量を30→20 GiB | RDSの既存リソース更新が `NotImplemented`。ロールバック後は30 GiB | RDS本来の縮小禁止は検証できない |
| `PocRoomEbsShrink` | EBSの容量を30→20 GiB | EBSの既存リソース更新が `NotImplemented`。ロールバック後は30 GiB | EBS本来の縮小禁止は検証できない |
| `PocRoomDynamoIndexLimit` | GSIを一度に2個追加 | DynamoDBの既存リソース更新が `NotImplemented`。ロールバック後もGSIなし | 同時追加数の制限は検証できない |
| `PocRoomDynamoKeyChange` | 固定名テーブルの主キーを `id` → `newId` | DynamoDBの既存リソース更新が `NotImplemented`。ロールバック後は `id` | 主キー変更時の実AWSの挙動は検証できない |
| `PocRoomObjectLockSuspend` | Object Lockを指定したバケットのバージョニングを停止 | 初回デプロイ成功後も設定取得APIが `ObjectLockConfigurationNotFoundError`。更新は成功し `Suspended` | Object Lockの前提が成立せず、制約を再現できない |

RDSは30→40 GiBの拡張も同じ未実装エラーでした。「縮小だから失敗した」とは判定していません。実AWSへのデプロイ、SQLの実行、ディスクの読み書き、既存データの保全は対象外です。

## 名前衝突を再現する

名前衝突はコード整理でも起こり得ます。CDK内のIDを変えると、CloudFormationは別リソースとして扱います。この例では、新しいテーブルを作るときに、元のテーブルが同じ名前で残っています。実リソース名を変える操作は行いません。

[app.mjs](app.mjs) の `const update = false` が初回用です。`aws-emulator/` フォルダで実行します。9300は検証専用に使用してください。

```sh
npm --prefix cdk ci
./emulator --port 9300 up
./emulator --port 9300 cdk bootstrap aws://000000000000/us-east-1
./emulator --port 9300 cdk deploy PocRoomLogicalIdRename --app 'node update-failures/app.mjs' --require-approval never
```

初回は `poc-room-logical-id-rename` テーブルと、保存期間7日のロググループを作ります。続いて `app.mjs` の `const update = false` を `true` に変更します。

```sh
./emulator --port 9300 cdk synth PocRoomLogicalIdRename --app 'node update-failures/app.mjs' --quiet
./emulator --port 9300 cdk deploy PocRoomLogicalIdRename --app 'node update-failures/app.mjs' --require-approval never
```

`synth` は成功し、`deploy` は終了コード1になります。失敗理由は `poc-room-logical-id-rename already exists in stack ...` です。

```sh
./emulator --port 9300 aws cloudformation describe-stack-events --stack-name PocRoomLogicalIdRename
./emulator --port 9300 aws cloudformation describe-stacks --stack-name PocRoomLogicalIdRename
./emulator --port 9300 aws dynamodb describe-table --table-name poc-room-logical-id-rename
```

実測したイベントの順序は次のとおりです。

```text
Stack         UPDATE_IN_PROGRESS
Logs          UPDATE_COMPLETE
RenamedTable  CREATE_FAILED: already exists in stack
Stack         UPDATE_ROLLBACK_IN_PROGRESS
Logs          UPDATE_COMPLETE
Stack         UPDATE_ROLLBACK_COMPLETE
```

ロールバック後のテーブルの `TableId` は初回と一致し、ログ保存期間は7日でした。ロググループ名はスタックの `LogGroupName` 出力から取得でき、`logs describe-log-groups` で `retentionInDays` を確認できます。

比較用に、`update = true` のままテーブルのCDK IDを元の `Table` に固定してデプロイすると、更新は成功し、実際のログ保存期間が14日になりました。テーブルの `TableId` は変わりません。ログ保存期間の変更自体が失敗原因ではありません。

## 他のケースを試す

`app.mjs` を `update = false` に戻し、表にあるスタックを初回デプロイします。その後 `true` に変え、同じスタックを更新してください。対象は `--app 'node update-failures/app.mjs'` で選びます。

RDSだけは [../rds-rollback/app.mjs](../rds-rollback/app.mjs) を使います。

```sh
./emulator --port 9300 cdk deploy PocRoomRdsRollback --app 'node rds-rollback/app.mjs' --require-approval never
```

初回の `allocatedStorage: '30'` を `'20'` に変更して、同じコマンドを実行します。比較用の拡張は `'40'` です。記載したパスワードはローカル実験用の固定値で、実アカウントの認証情報ではありません。

この版の実測では、EBS・DynamoDBの未実装ケースも `UPDATE_ROLLBACK_COMPLETE` になりました。この状態表示だけでは、実AWSの制約を再現した証拠にはなりません。必ずイベントの失敗理由と、サービスAPIが返す実際の設定を確認してください。

## 後片付け

ソースを初回の値へ戻し、作成したスタックを削除します。以下の `--all` は、この実験アプリに定義した5スタックが対象です。

```sh
./emulator --port 9300 cdk destroy --all --app 'node update-failures/app.mjs' --force
./emulator --port 9300 cdk destroy PocRoomRdsRollback --app 'node rds-rollback/app.mjs' --force
./emulator --port 9300 down
```

## 根拠

- [CDKのIDとリソースの作り直し](https://docs.aws.amazon.com/cdk/v2/guide/identifiers.html)
- [RDSの容量縮小による更新失敗の例](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-updating-stacks-monitor-stack.html)
- [EBSの変更制限](https://docs.aws.amazon.com/ebs/latest/userguide/ebs-modify-volume.html)
- [DynamoDBのGSI更新制限](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-dynamodb-table.html)
- [Object Lock有効後の制限](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock-managing.html)
- [実行ログとAPI応答](../../../.space/default/tasks/aws-emulator-setup/evidence/)
