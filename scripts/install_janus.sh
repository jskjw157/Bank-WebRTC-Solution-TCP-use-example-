#!/bin/bash
# Janus Gateway 설치 스크립트

set -e

echo "========================================"
echo "Janus WebRTC Gateway 설치"
echo "========================================"

cd ~

# 기존 Janus 제거
if [ -d "janus-gateway" ]; then
    echo "기존 janus-gateway 디렉토리 제거 중..."
    rm -rf janus-gateway
fi

# Janus 클론
echo "📥 Janus Gateway 클론 중..."
git clone https://github.com/meetecho/janus-gateway.git

cd janus-gateway

# 설정 생성
echo "⚙️ 설정 파일 생성 중..."
sh autogen.sh

# TCP 전용으로 컴파일
echo "🔨 Janus 컴파일 중 (TCP 전용)..."
./configure \
    --prefix=/opt/janus \
    --enable-post-processing \
    --enable-docs \
    --enable-rest \
    --enable-data-channels \
    --enable-websockets \
    --enable-rabbitmq=no \
    --enable-mqtt=no

# 컴파일
echo "🔨 빌드 중... (시간이 걸릴 수 있습니다)"
make

# 설치
echo "📦 설치 중..."
sudo make install

# Config 파일 복사
echo "📋 설정 파일 복사 중..."
sudo make configs

# 디렉토리 권한 설정
echo "🔐 권한 설정 중..."
sudo mkdir -p /opt/janus/recordings
sudo chmod -R 755 /opt/janus
sudo chown -R $USER:$USER /opt/janus/recordings

echo "✅ Janus Gateway 설치 완료!"
echo "설치 위치: /opt/janus"
echo ""
echo "다음 단계:"
echo "1. setup_janus.sh 스크립트로 설정 파일 생성"
echo "2. SSL 인증서 설정"
echo "3. start_janus.sh로 Janus 시작"
