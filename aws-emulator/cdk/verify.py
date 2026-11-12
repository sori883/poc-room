"""CDKが作成したリソースでAPIを試し、検証用のデータだけを削除する。"""

import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import uuid


def aws(*args):
    response = subprocess.run(
        ["aws", *args, "--output", "json", "--cli-connect-timeout", "5", "--cli-read-timeout", "10"],
        check=True, capture_output=True, text=True,
    )
    return json.loads(response.stdout) if response.stdout.strip() else {}


def expect(actual, expected):
    if actual != expected:
        raise RuntimeError(f"期待値: {expected!r} / 実際: {actual!r}")


def verify_bucket(bucket, test_id):
    key = f"cdk-verification/{test_id}.txt"
    with tempfile.TemporaryDirectory() as directory:
        source = Path(directory) / "source.txt"
        target = Path(directory) / "download.txt"
        source.write_text("Hello from CDK!\n", encoding="utf-8")
        try:
            aws("s3api", "put-object", "--bucket", bucket, "--key", key, "--body", str(source))
            aws("s3api", "get-object", "--bucket", bucket, "--key", key, str(target))
            expect(target.read_text(encoding="utf-8"), "Hello from CDK!\n")
        finally:
            aws("s3api", "delete-object", "--bucket", bucket, "--key", key)
    print(f"PASS CDK S3: {bucket} のファイル保存・内容確認", flush=True)


def verify_table(table, test_id):
    item = {"id": {"S": test_id}, "message": {"S": "Hello from CDK!"}}
    key = json.dumps({"id": {"S": test_id}})
    try:
        aws("dynamodb", "put-item", "--table-name", table, "--item", json.dumps(item))
        result = aws("dynamodb", "get-item", "--table-name", table, "--key", key, "--consistent-read")
        expect(result.get("Item"), item)
    finally:
        aws("dynamodb", "delete-item", "--table-name", table, "--key", key)
    print(f"PASS CDK DynamoDB: {table} の項目登録・内容確認", flush=True)


def verify_queue(queue, test_id):
    body = f"Hello from CDK! {test_id}"
    sent = aws("sqs", "send-message", "--queue-url", queue, "--message-body", body)
    for _ in range(5):
        messages = aws("sqs", "receive-message", "--queue-url", queue,
                       "--wait-time-seconds", "1", "--max-number-of-messages", "10").get("Messages", [])
        found = False
        for message in messages:
            if message["MessageId"] == sent["MessageId"]:
                expect(message["Body"], body)
                aws("sqs", "delete-message", "--queue-url", queue,
                    "--receipt-handle", message["ReceiptHandle"])
                found = True
            else:
                aws("sqs", "change-message-visibility", "--queue-url", queue,
                    "--receipt-handle", message["ReceiptHandle"], "--visibility-timeout", "0")
        if found:
            print("PASS CDK SQS: メッセージ送信・本文確認・検証メッセージの削除", flush=True)
            return
    raise RuntimeError("検証メッセージを受信できませんでした。キュー内のメッセージを確認してください。")


def main():
    if not os.environ.get("AWS_ENDPOINT_URL", "").startswith("https://127.0.0.1:"):
        raise RuntimeError("./emulator cdk-test から実行してください。")
    expect(aws("sts", "get-caller-identity")["Account"], "000000000000")
    stack = aws("cloudformation", "describe-stacks", "--stack-name", "PocRoomEmulatorDemo")["Stacks"][0]
    if stack["StackStatus"] not in ("CREATE_COMPLETE", "UPDATE_COMPLETE"):
        raise RuntimeError(f"スタックのデプロイが完了していません: {stack['StackStatus']}")
    outputs = {output["OutputKey"]: output["OutputValue"] for output in stack["Outputs"]}
    test_id = f"cdk-test-{uuid.uuid4().hex}"
    verify_bucket(outputs["BucketName"], test_id)
    verify_table(outputs["TableName"], test_id)
    verify_queue(outputs["QueueUrl"], test_id)


if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError as error:
        print(error.stderr, file=sys.stderr)
        sys.exit(error.returncode)
    except (KeyError, RuntimeError) as error:
        print(f"FAIL: {error}", file=sys.stderr)
        sys.exit(1)
