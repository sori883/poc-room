import {
  App, Stack, CfnOutput, RemovalPolicy,
  aws_s3 as s3, aws_dynamodb as dynamodb, aws_sqs as sqs,
} from 'aws-cdk-lib';

if (!/^https:\/\/127\.0\.0\.1:\d+$/.test(process.env.AWS_ENDPOINT_URL ?? '')) {
  throw new Error('ローカル用の ./emulator cdk コマンドから実行してください。');
}

const app = new App();
const stack = new Stack(app, 'PocRoomEmulatorDemo', {
  env: { account: '000000000000', region: 'us-east-1' },
  description: 'S3, DynamoDB and SQS playground for the local AWS Emulator',
});

const bucket = new s3.Bucket(stack, 'Assets', {
  removalPolicy: RemovalPolicy.DESTROY,
});

const table = new dynamodb.Table(stack, 'Notes', {
  partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  removalPolicy: RemovalPolicy.DESTROY,
});

const queue = new sqs.Queue(stack, 'Jobs', {
  removalPolicy: RemovalPolicy.DESTROY,
});

new CfnOutput(stack, 'BucketName', { value: bucket.bucketName });
new CfnOutput(stack, 'TableName', { value: table.tableName });
new CfnOutput(stack, 'QueueUrl', { value: queue.queueUrl });
