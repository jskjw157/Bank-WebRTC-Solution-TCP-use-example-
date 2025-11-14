#!/bin/bash
# Janus Gateway 종료 스크립트

set -e

echo "========================================"
echo "Janus WebRTC Gateway 종료"
echo "========================================"

# Janus 프로세스 확인
if ! pgrep -x "janus" > /dev/null; then
    echo "⚠️  Janus가 실행 중이지 않습니다."
    exit 0
fi

# Janus 종료
echo "🛑 Janus 종료 중..."
pkill -TERM janus

# 종료 확인
sleep 2

if pgrep -x "janus" > /dev/null; then
    echo "⚠️  정상 종료 실패, 강제 종료 시도..."
    pkill -9 janus
    sleep 1
fi

if ! pgrep -x "janus" > /dev/null; then
    echo "✅ Janus가 성공적으로 종료되었습니다."
else
    echo "❌ Janus 종료 실패!"
    exit 1
fi
