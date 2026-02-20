#!/bin/bash
# ローカルDynamoDBにテーブルを作成するスクリプト

ENDPOINT="http://localhost:8000"

echo "Creating futsal-tournament table..."

aws dynamodb create-table \
  --endpoint-url "$ENDPOINT" \
  --table-name futsal-tournament \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
    AttributeName=status,AttributeType=S \
    AttributeName=scheduledTime,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes \
    '[{
      "IndexName": "status-scheduledTime-index",
      "KeySchema": [
        {"AttributeName": "status", "KeyType": "HASH"},
        {"AttributeName": "scheduledTime", "KeyType": "RANGE"}
      ],
      "Projection": {"ProjectionType": "ALL"}
    }]' \
  --region ap-northeast-1 \
  --no-cli-pager

echo "Done."
