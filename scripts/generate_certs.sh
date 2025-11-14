#!/bin/bash
# 개발용 SSL 자체 서명 인증서 생성

set -e

CERTS_DIR="/home/user/webapp/certs"

echo "========================================"
echo "개발용 SSL 인증서 생성"
echo "========================================"

# 인증서 디렉토리 생성
mkdir -p "$CERTS_DIR"

# 자체 서명 인증서 생성
echo "🔐 자체 서명 인증서 생성 중..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$CERTS_DIR/key.pem" \
  -out "$CERTS_DIR/cert.pem" \
  -subj "/C=KR/ST=Seoul/L=Seoul/O=FinancialAuth/CN=localhost"

# 권한 설정
chmod 600 "$CERTS_DIR/key.pem"
chmod 644 "$CERTS_DIR/cert.pem"

echo "✅ 인증서 생성 완료!"
echo "위치: $CERTS_DIR"
echo ""
echo "⚠️  주의: 이 인증서는 개발용입니다."
echo "   프로덕션 환경에서는 Let's Encrypt 등의 공인 인증서를 사용하세요."
echo ""
echo "브라우저에서 접속 시 인증서 경고가 나타날 수 있습니다."
echo "'고급' -> '계속 진행'을 선택하여 접속하세요."
