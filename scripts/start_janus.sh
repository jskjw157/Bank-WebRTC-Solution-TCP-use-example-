#!/bin/bash
# Janus Gateway 시작 스크립트

set -e

echo "========================================"
echo "Janus WebRTC Gateway 시작"
echo "========================================"

# Janus 설치 확인
if [ ! -f "/opt/janus/bin/janus" ]; then
    echo "❌ Janus가 설치되지 않았습니다."
    echo "   scripts/install_janus.sh를 먼저 실행하세요."
    exit 1
fi

# 설정 파일 확인
if [ ! -f "/opt/janus/etc/janus/janus.jcfg" ]; then
    echo "❌ Janus 설정 파일이 없습니다."
    echo "   scripts/setup_janus.sh를 먼저 실행하세요."
    exit 1
fi

# 기존 Janus 프로세스 확인
if pgrep -x "janus" > /dev/null; then
    echo "⚠️  Janus가 이미 실행 중입니다."
    read -p "종료하고 재시작하시겠습니까? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🛑 기존 Janus 종료 중..."
        pkill -9 janus || true
        sleep 2
    else
        echo "취소되었습니다."
        exit 0
    fi
fi

# 로그 디렉토리 생성
mkdir -p /home/user/webapp/logs

# 녹화 디렉토리 생성
mkdir -p /home/user/webapp/recordings
chmod 755 /home/user/webapp/recordings

# Janus 시작
echo "🚀 Janus 시작 중..."

# 백그라운드로 실행
/opt/janus/bin/janus \
    --config=/opt/janus/etc/janus/janus.jcfg \
    --log-file=/home/user/webapp/logs/janus.log \
    --daemon

# 시작 확인
sleep 3

if pgrep -x "janus" > /dev/null; then
    echo ""
    echo "✅ Janus가 성공적으로 시작되었습니다!"
    echo ""
    echo "📊 연결 정보:"
    echo "   HTTP API:  http://localhost:8088/janus"
    echo "   HTTPS API: https://localhost:8089/janus"
    echo "   WebSocket: ws://localhost:8188"
    echo "   WSS:       wss://localhost:8989"
    echo ""
    echo "📋 로그 확인:"
    echo "   tail -f /home/user/webapp/logs/janus.log"
    echo ""
    echo "🛑 종료하려면:"
    echo "   pkill janus"
else
    echo ""
    echo "❌ Janus 시작 실패!"
    echo "로그를 확인하세요: cat /home/user/webapp/logs/janus.log"
    exit 1
fi
