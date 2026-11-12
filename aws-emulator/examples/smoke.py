"""./emulator demo [all|s3|dynamodb|sqs] から実行するAPIサンプル。"""

import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time
import uuid


def aws(*args):
    result = subprocess.run(
        ["aws", *args, "--output", "json", "--cli-connect-timeout", "5", "--cli-read-timeout", "10"],
        check=True, capture_output=True, text=True,
    )
    return json.loads(result.stdout) if result.stdout.strip() else {}


def expect(actual, expected):
    if actual != expected:
        raise RuntimeError(f"期待値: {expected!r} / 実際: {actual!r}")


def s3():
    bucket = f"poc-room-demo-{uuid.uuid4().hex[:12]}"
    aws("s3api", "create-bucket", "--bucket", bucket)
    try:
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "hello.txt"
            target = Path(directory) / "download.txt"
            source.write_text("Hello from poc-room!\n", encoding="utf-8")
            aws("s3api", "put-object", "--bucket", bucket, "--key", "hello.txt", "--body", str(source))
            aws("s3api", "get-object", "--bucket", bucket, "--key", "hello.txt", str(target))
            expect(target.read_text(encoding="utf-8"), "Hello from poc-room!\n")
    finally:
        aws("s3api", "delete-object", "--bucket", bucket, "--key", "hello.txt")
        aws("s3api", "delete-bucket", "--bucket", bucket)
    print("PASS S3: バケット作成 → ファイル保存 → 内容確認 → 削除", flush=True)


def dynamodb():
    table = f"poc-room-demo-{uuid.uuid4().hex[:12]}"
    aws("dynamodb", "create-table", "--table-name", table,
        "--attribute-definitions", "AttributeName=id,AttributeType=S",
        "--key-schema", "AttributeName=id,KeyType=HASH", "--billing-mode", "PAY_PER_REQUEST")
    try:
        aws("dynamodb", "wait", "table-exists", "--table-name", table)
        item = {"id": {"S": "note-001"}, "message": {"S": "Hello from poc-room!"}}
        aws("dynamodb", "put-item", "--table-name", table, "--item", json.dumps(item))
        response = aws("dynamodb", "get-item", "--table-name", table,
                       "--key", json.dumps({"id": {"S": "note-001"}}), "--consistent-read")
        expect(response.get("Item"), item)
    finally:
        aws("dynamodb", "delete-table", "--table-name", table)
        aws("dynamodb", "wait", "table-not-exists", "--table-name", table)
    print("PASS DynamoDB: テーブル作成 → 登録 → 内容確認 → 削除", flush=True)


def sqs():
    queue = aws("sqs", "create-queue", "--queue-name", f"poc-room-demo-{uuid.uuid4().hex[:12]}")["QueueUrl"]
    try:
        sent = aws("sqs", "send-message", "--queue-url", queue, "--message-body", "Hello from poc-room!")
        messages = []
        for _ in range(5):
            messages = aws("sqs", "receive-message", "--queue-url", queue,
                           "--max-number-of-messages", "1", "--wait-time-seconds", "1").get("Messages", [])
            if messages:
                break
            time.sleep(1)
        expect(len(messages), 1)
        expect(messages[0]["Body"], "Hello from poc-room!")
        expect(messages[0]["MessageId"], sent["MessageId"])
        aws("sqs", "delete-message", "--queue-url", queue, "--receipt-handle", messages[0]["ReceiptHandle"])
    finally:
        aws("sqs", "delete-queue", "--queue-url", queue)
    print("PASS SQS: キュー作成 → 送信 → 内容確認 → 削除", flush=True)


def main():
    if not os.environ.get("AWS_ENDPOINT_URL", "").startswith("https://127.0.0.1:"):
        raise RuntimeError("./emulator demo から実行してください。")
    expect(aws("sts", "get-caller-identity")["Account"], "000000000000")
    service = sys.argv[1] if len(sys.argv) > 1 else "all"
    for name, execute in {"s3": s3, "dynamodb": dynamodb, "sqs": sqs}.items():
        if service in ("all", name):
            execute()


if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError as error:
        print(error.stderr, file=sys.stderr)
        sys.exit(error.returncode)
    except RuntimeError as error:
        print(f"FAIL: {error}", file=sys.stderr)
        sys.exit(1)
