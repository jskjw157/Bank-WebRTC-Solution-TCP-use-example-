#!/bin/bash
# Janus 설정 파일 복사 및 구성

set -e

echo "========================================"
echo "Janus 설정 구성"
echo "========================================"

JANUS_CONFIG_DIR="/opt/janus/etc/janus"
PROJECT_CONFIG_DIR="/home/user/webapp/janus-config"

# Janus가 설치되어 있는지 확인
if [ ! -d "/opt/janus" ]; then
    echo "❌ Janus가 설치되지 않았습니다."
    echo "   scripts/install_janus.sh를 먼저 실행하세요."
    exit 1
fi

# 설정 디렉토리 백업
if [ -d "$JANUS_CONFIG_DIR" ]; then
    echo "📦 기존 설정 백업 중..."
    sudo cp -r "$JANUS_CONFIG_DIR" "${JANUS_CONFIG_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
fi

# 프로젝트 설정 파일 복사
echo "📋 설정 파일 복사 중..."
sudo cp "$PROJECT_CONFIG_DIR/janus.jcfg" "$JANUS_CONFIG_DIR/"
sudo cp "$PROJECT_CONFIG_DIR/janus.transport.http.jcfg" "$JANUS_CONFIG_DIR/"
sudo cp "$PROJECT_CONFIG_DIR/janus.plugin.videoroom.jcfg" "$JANUS_CONFIG_DIR/"

# 공인 IP 설정 (선택사항)
echo ""
echo "🌐 공인 IP를 설정하시겠습니까? (Enter를 누르면 건너뜁니다)"
read -p "공인 IP: " PUBLIC_IP

if [ -n "$PUBLIC_IP" ]; then
    echo "공인 IP 설정 중: $PUBLIC_IP"
    sudo sed -i "s/# public_ip = \"YOUR_PUBLIC_IP_HERE\"/public_ip = \"$PUBLIC_IP\"/" "$JANUS_CONFIG_DIR/janus.jcfg"
    
    # .env 파일 업데이트
    if [ -f "/home/user/webapp/.env" ]; then
        sed -i "s/PUBLIC_IP=.*/PUBLIC_IP=$PUBLIC_IP/" "/home/user/webapp/.env"
    fi
fi

# API Secret 생성
echo ""
echo "🔐 API Secret 생성 중..."
API_SECRET=$(openssl rand -hex 32)
ADMIN_SECRET=$(openssl rand -hex 32)

sudo sed -i "s/changeme_api_secret/$API_SECRET/" "$JANUS_CONFIG_DIR/janus.jcfg"
sudo sed -i "s/changeme_admin_secret/$ADMIN_SECRET/" "$JANUS_CONFIG_DIR/janus.jcfg"
sudo sed -i "s/changeme_admin_secret/$ADMIN_SECRET/" "$JANUS_CONFIG_DIR/janus.transport.http.jcfg"

# .env 파일 생성/업데이트
ENV_FILE="/home/user/webapp/.env"
if [ ! -f "$ENV_FILE" ]; then
    cp "/home/user/webapp/.env.example" "$ENV_FILE"
fi

sed -i "s/JANUS_API_SECRET=.*/JANUS_API_SECRET=$API_SECRET/" "$ENV_FILE"
sed -i "s/JANUS_ADMIN_SECRET=.*/JANUS_ADMIN_SECRET=$ADMIN_SECRET/" "$ENV_FILE"

echo ""
echo "✅ Janus 설정 완료!"
echo ""
echo "📋 생성된 Secret:"
echo "   API Secret: $API_SECRET"
echo "   Admin Secret: $ADMIN_SECRET"
echo ""
echo "⚠️  이 Secret들을 안전하게 보관하세요!"
echo ""
echo "다음 단계:"
echo "1. SSL 인증서 생성: bash scripts/generate_certs.sh"
echo "2. Janus 시작: bash scripts/start_janus.sh"
