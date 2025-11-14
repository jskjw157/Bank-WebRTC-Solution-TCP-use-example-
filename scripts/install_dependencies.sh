#!/bin/bash
# Janus WebRTC Gateway 의존성 설치 스크립트

set -e

echo "========================================"
echo "Janus WebRTC Gateway 의존성 설치"
echo "========================================"

# 시스템 업데이트
echo "📦 시스템 업데이트 중..."
sudo apt-get update
sudo apt-get upgrade -y

# 필수 패키지 설치
echo "📦 필수 패키지 설치 중..."
sudo apt-get install -y \
    git \
    libmicrohttpd-dev \
    libjansson-dev \
    libssl-dev \
    libsrtp2-dev \
    libsofia-sip-ua-dev \
    libglib2.0-dev \
    libopus-dev \
    libogg-dev \
    libcurl4-openssl-dev \
    liblua5.3-dev \
    libconfig-dev \
    pkg-config \
    gengetopt \
    libtool \
    automake \
    gtk-doc-tools \
    cmake \
    build-essential

# Nginx 설치
echo "📦 Nginx 설치 중..."
sudo apt-get install -y nginx

# Node.js 설치 (없는 경우)
if ! command -v node &> /dev/null; then
    echo "📦 Node.js 설치 중..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "✅ 의존성 설치 완료!"
echo "Node.js 버전: $(node -v)"
echo "npm 버전: $(npm -v)"
