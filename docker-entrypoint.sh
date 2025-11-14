#!/bin/bash
set -e

echo "========================================"
echo "금융권 TCP 화상인증 시스템 시작"
echo "========================================"

# 디렉토리 생성
mkdir -p /app/logs
mkdir -p /app/recordings
mkdir -p /app/certs

# SSL 인증서 확인
if [ ! -f "/app/certs/cert.pem" ] || [ ! -f "/app/certs/key.pem" ]; then
    echo "⚠️  SSL 인증서가 없습니다. 자체 서명 인증서를 생성합니다..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /app/certs/key.pem \
        -out /app/certs/cert.pem \
        -subj "/C=KR/ST=Seoul/L=Seoul/O=FinancialAuth/CN=localhost"
    echo "✅ 인증서 생성 완료"
fi

# Janus 설정 파일 복사 (없는 경우)
if [ ! -f "/opt/janus/etc/janus/janus.jcfg" ]; then
    echo "📋 Janus 설정 파일 복사 중..."
    cp /app/janus-config/*.jcfg /opt/janus/etc/janus/
    
    # API Secret 생성
    API_SECRET=${JANUS_API_SECRET:-$(openssl rand -hex 32)}
    ADMIN_SECRET=${JANUS_ADMIN_SECRET:-$(openssl rand -hex 32)}
    
    sed -i "s/changeme_api_secret/$API_SECRET/" /opt/janus/etc/janus/janus.jcfg
    sed -i "s/changeme_admin_secret/$ADMIN_SECRET/" /opt/janus/etc/janus/janus.jcfg
    sed -i "s/changeme_admin_secret/$ADMIN_SECRET/" /opt/janus/etc/janus/janus.transport.http.jcfg
    
    echo "🔐 API Secret: $API_SECRET"
    echo "🔐 Admin Secret: $ADMIN_SECRET"
fi

# 공인 IP 설정
if [ -n "$PUBLIC_IP" ]; then
    echo "🌐 공인 IP 설정: $PUBLIC_IP"
    sed -i "s/# public_ip = \"YOUR_PUBLIC_IP_HERE\"/public_ip = \"$PUBLIC_IP\"/" /opt/janus/etc/janus/janus.jcfg
fi

# Janus 시작
echo "🚀 Janus Gateway 시작 중..."
/opt/janus/bin/janus \
    --config=/opt/janus/etc/janus/janus.jcfg \
    --log-file=/app/logs/janus.log &

# Janus 시작 대기
sleep 5

# Node.js 애플리케이션 시작
echo "🚀 시그널링 서버 시작 중..."
exec "$@"
