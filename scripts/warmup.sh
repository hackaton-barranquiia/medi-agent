#!/bin/bash
URL="${NEXT_PUBLIC_APP_URL:-https://turnos-agent-production.up.railway.app}"

while true; do
  curl -s "$URL/api/health" > /dev/null
  curl -s "$URL/api/dashboard/kpis" > /dev/null
  curl -s -X POST "$URL/api/tools/verify-cc" \
    -H "content-type: application/json" \
    -d '{"message":{"toolCalls":[{"id":"w","function":{"arguments":{"patient_id":"11111111-1111-1111-1111-111111111111","last_4_cc":"0000"}}}]}}' \
    > /dev/null
  sleep 240
done
