import {
  App, Stack, CfnOutput, RemovalPolicy,
  aws_ec2 as ec2, aws_s3 as s3, aws_dynamodb as dynamodb, aws_logs as logs,
} from 'aws-cdk-lib';

if (!/^https:\/\/127\.0\.0\.1:\d+$/.test(process.env.AWS_ENDPOINT_URL ?? '')) {
  throw new Error('ローカル用の ./emulator cdk コマンドから実行してください。');
}

const update = false;
const app = new App();
const environment = { account: '000000000000', region: 'us-east-1' };

const ebs = new Stack(app, 'PocRoomEbsShrink', { env: environment });
const volume = new ec2.CfnVolume(ebs, 'Volume', {
  availabilityZone: 'us-east-1a',
  size: update ? 20 : 30,
  volumeType: 'gp3',
});
volume.applyRemovalPolicy(RemovalPolicy.DESTROY);
new CfnOutput(ebs, 'VolumeId', { value: volume.ref });

const objectLock = new Stack(app, 'PocRoomObjectLockSuspend', { env: environment });
const bucket = new s3.CfnBucket(objectLock, 'Bucket', {
  bucketName: 'poc-room-object-lock-update',
  objectLockEnabled: true,
  objectLockConfiguration: { objectLockEnabled: 'Enabled' },
  versioningConfiguration: { status: update ? 'Suspended' : 'Enabled' },
});
bucket.applyRemovalPolicy(RemovalPolicy.DESTROY);
new CfnOutput(objectLock, 'BucketName', { value: bucket.ref });

const indexes = new Stack(app, 'PocRoomDynamoIndexLimit', { env: environment });
const indexAttributes = update ? ['email', 'category'] : [];
const table = new dynamodb.CfnTable(indexes, 'Table', {
  tableName: 'poc-room-dynamo-index-limit',
  billingMode: 'PAY_PER_REQUEST',
  keySchema: [{ attributeName: 'id', keyType: 'HASH' }],
  attributeDefinitions: ['id', ...indexAttributes].map(attributeName => ({
    attributeName, attributeType: 'S',
  })),
  globalSecondaryIndexes: indexAttributes.length ? indexAttributes.map(attributeName => ({
    indexName: `by-${attributeName}`,
    keySchema: [{ attributeName, keyType: 'HASH' }],
    projection: { projectionType: 'ALL' },
  })) : undefined,
});
table.applyRemovalPolicy(RemovalPolicy.DESTROY);
new CfnOutput(indexes, 'TableName', { value: table.ref });

const keyChange = new Stack(app, 'PocRoomDynamoKeyChange', { env: environment });
const key = update ? 'newId' : 'id';
const namedTable = new dynamodb.CfnTable(keyChange, 'Table', {
  tableName: 'poc-room-dynamo-key-change',
  billingMode: 'PAY_PER_REQUEST',
  keySchema: [{ attributeName: key, keyType: 'HASH' }],
  attributeDefinitions: [{ attributeName: key, attributeType: 'S' }],
});
namedTable.applyRemovalPolicy(RemovalPolicy.DESTROY);
new CfnOutput(keyChange, 'TableName', { value: namedTable.ref });

const rename = new Stack(app, 'PocRoomLogicalIdRename', { env: environment });
const logGroup = new logs.CfnLogGroup(rename, 'Logs', {
  retentionInDays: update ? 14 : 7,
});
logGroup.applyRemovalPolicy(RemovalPolicy.DESTROY);
const renamedTable = new dynamodb.CfnTable(rename, update ? 'RenamedTable' : 'Table', {
  tableName: 'poc-room-logical-id-rename',
  billingMode: 'PAY_PER_REQUEST',
  keySchema: [{ attributeName: 'id', keyType: 'HASH' }],
  attributeDefinitions: [{ attributeName: 'id', attributeType: 'S' }],
});
renamedTable.applyRemovalPolicy(RemovalPolicy.DESTROY);
renamedTable.addResourceDependency(logGroup);
new CfnOutput(rename, 'TableName', { value: renamedTable.ref });
new CfnOutput(rename, 'LogGroupName', { value: logGroup.ref });
