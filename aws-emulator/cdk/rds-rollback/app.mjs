import { App, Stack, CfnOutput, RemovalPolicy, aws_rds as rds } from 'aws-cdk-lib';

if (!/^https:\/\/127\.0\.0\.1:\d+$/.test(process.env.AWS_ENDPOINT_URL ?? '')) {
  throw new Error('ローカル用の ./emulator cdk コマンドから実行してください。');
}

const app = new App();
const stack = new Stack(app, 'PocRoomRdsRollback', {
  env: { account: '000000000000', region: 'us-east-1' },
  description: 'Local RDS storage reduction and update rollback experiment',
});

const database = new rds.CfnDBInstance(stack, 'Database', {
  dbInstanceIdentifier: 'poc-room-rds-rollback',
  engine: 'postgres',
  dbInstanceClass: 'db.t3.micro',
  allocatedStorage: '30',
  storageType: 'gp3',
  masterUsername: 'emulatoruser',
  masterUserPassword: 'LocalEmulatorOnly42',
  backupRetentionPeriod: 0,
  deletionProtection: false,
  publiclyAccessible: false,
});
database.applyRemovalPolicy(RemovalPolicy.DESTROY);

new CfnOutput(stack, 'DatabaseIdentifier', { value: database.ref });
