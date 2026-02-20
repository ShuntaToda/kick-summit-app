#!/bin/bash
# ローカルDynamoDBにサンプルデータを投入するスクリプト

ENDPOINT="http://localhost:8000"
TABLE="futsal-tournament"
PK="TOURNAMENT#default"

put_item() {
  aws dynamodb put-item \
    --endpoint-url "$ENDPOINT" \
    --table-name "$TABLE" \
    --item "$1" \
    --region ap-northeast-1 \
    --no-cli-pager
}

echo "=== 大会情報 ==="
put_item '{
  "PK":{"S":"'"$PK"'"}, "SK":{"S":"METADATA"},
  "id":{"S":"default"}, "name":{"S":"Kick Summit 2026"},
  "date":{"S":"2026-03-15"}, "passwordHash":{"S":"admin"}
}'

echo "=== チーム ==="
put_item '{"PK":{"S":"'"$PK"'"}, "SK":{"S":"TEAM#t1"}, "id":{"S":"t1"}, "name":{"S":"FC Thunder"},  "group":{"S":"A"}, "color":{"S":"#ef4444"}}'
put_item '{"PK":{"S":"'"$PK"'"}, "SK":{"S":"TEAM#t2"}, "id":{"S":"t2"}, "name":{"S":"Blue Sharks"}, "group":{"S":"A"}, "color":{"S":"#3b82f6"}}'
put_item '{"PK":{"S":"'"$PK"'"}, "SK":{"S":"TEAM#t3"}, "id":{"S":"t3"}, "name":{"S":"Green Vipers"},"group":{"S":"A"}, "color":{"S":"#22c55e"}}'
put_item '{"PK":{"S":"'"$PK"'"}, "SK":{"S":"TEAM#t4"}, "id":{"S":"t4"}, "name":{"S":"Golden Eagles"},"group":{"S":"B"}, "color":{"S":"#eab308"}}'
put_item '{"PK":{"S":"'"$PK"'"}, "SK":{"S":"TEAM#t5"}, "id":{"S":"t5"}, "name":{"S":"Purple Storm"},"group":{"S":"B"}, "color":{"S":"#a855f7"}}'
put_item '{"PK":{"S":"'"$PK"'"}, "SK":{"S":"TEAM#t6"}, "id":{"S":"t6"}, "name":{"S":"Red Phoenix"}, "group":{"S":"B"}, "color":{"S":"#f97316"}}'

echo "=== 予選リーグ試合 (グループA) ==="
put_item '{"PK":{"S":"'"$PK"'"}, "SK":{"S":"MATCH#m1"}, "id":{"S":"m1"}, "type":{"S":"league"}, "group":{"S":"A"}, "teamAId":{"S":"t1"}, "teamBId":{"S":"t2"}, "scoreA":{"N":"3"}, "scoreB":{"N":"1"}, "halfScoreA":{"N":"1"}, "halfScoreB":{"N":"0"}, "scheduledTime":{"S":"2026-03-15T10:00:00"}, "court":{"S":"コート1"}, "status":{"S":"finished"}}'
put_item '{"PK":{"S":"'"$PK"'"}, "SK":{"S":"MATCH#m2"}, "id":{"S":"m2"}, "type":{"S":"league"}, "group":{"S":"A"}, "teamAId":{"S":"t2"}, "teamBId":{"S":"t3"}, "scoreA":{"N":"2"}, "scoreB":{"N":"2"}, "halfScoreA":{"N":"1"}, "halfScoreB":{"N":"1"}, "scheduledTime":{"S":"2026-03-15T10:30:00"}, "court":{"S":"コート2"}, "status":{"S":"finished"}}'
put_item '{"PK":{"S":"'"$PK"'"}, "SK":{"S":"MATCH#m3"}, "id":{"S":"m3"}, "type":{"S":"league"}, "group":{"S":"A"}, "teamAId":{"S":"t1"}, "teamBId":{"S":"t3"}, "scheduledTime":{"S":"2026-03-15T11:00:00"}, "court":{"S":"コート1"}, "status":{"S":"scheduled"}}'

echo "=== 予選リーグ試合 (グループB) ==="
put_item '{"PK":{"S":"'"$PK"'"}, "SK":{"S":"MATCH#m4"}, "id":{"S":"m4"}, "type":{"S":"league"}, "group":{"S":"B"}, "teamAId":{"S":"t4"}, "teamBId":{"S":"t5"}, "scoreA":{"N":"0"}, "scoreB":{"N":"1"}, "halfScoreA":{"N":"0"}, "halfScoreB":{"N":"0"}, "scheduledTime":{"S":"2026-03-15T10:00:00"}, "court":{"S":"コート2"}, "status":{"S":"finished"}}'
put_item '{"PK":{"S":"'"$PK"'"}, "SK":{"S":"MATCH#m5"}, "id":{"S":"m5"}, "type":{"S":"league"}, "group":{"S":"B"}, "teamAId":{"S":"t5"}, "teamBId":{"S":"t6"}, "scheduledTime":{"S":"2026-03-15T10:30:00"}, "court":{"S":"コート1"}, "status":{"S":"ongoing"}}'
put_item '{"PK":{"S":"'"$PK"'"}, "SK":{"S":"MATCH#m6"}, "id":{"S":"m6"}, "type":{"S":"league"}, "group":{"S":"B"}, "teamAId":{"S":"t4"}, "teamBId":{"S":"t6"}, "scheduledTime":{"S":"2026-03-15T11:00:00"}, "court":{"S":"コート2"}, "status":{"S":"scheduled"}}'

echo "=== 完了 ==="
echo "パスワード: admin"
