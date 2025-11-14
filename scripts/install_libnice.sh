#!/bin/bash
# libnice 설치 스크립트 (ICE/STUN/TURN)

set -e

echo "========================================"
echo "libnice 설치 중..."
echo "========================================"

cd ~

# 기존 libnice 제거
if [ -d "libnice" ]; then
    echo "기존 libnice 디렉토리 제거 중..."
    rm -rf libnice
fi

# libnice 클론
echo "📥 libnice 클론 중..."
git clone https://gitlab.freedesktop.org/libnice/libnice

cd libnice

# 빌드
echo "🔨 libnice 빌드 중..."
./autogen.sh
./configure --prefix=/usr
make

# 설치
echo "📦 libnice 설치 중..."
sudo make install

echo "✅ libnice 설치 완료!"
