# 📦 설치 가이드

이 문서는 금융권 TCP 화상인증 시스템의 상세 설치 가이드입니다.

## 목차

1. [시스템 요구사항](#시스템-요구사항)
2. [설치 방법](#설치-방법)
   - [방법 1: Docker 사용 (권장)](#방법-1-docker-사용-권장)
   - [방법 2: 수동 설치](#방법-2-수동-설치)
3. [설정](#설정)
4. [검증](#검증)
5. [문제 해결](#문제-해결)

## 시스템 요구사항

### 하드웨어

- **CPU**: 2 Core 이상 (4 Core 권장)
- **RAM**: 4GB 이상 (8GB 권장)
- **디스크**: 20GB 이상 여유 공간
- **네트워크**: 공인 IP 필수, 최소 10Mbps 대역폭

### 소프트웨어

#### OS
- Ubuntu 20.04 LTS
- Ubuntu 22.04 LTS (권장)
- Debian 11+

#### 필수 소프트웨어
- Node.js 18+ (20 권장)
- OpenSSL 1.1+
- Git

#### 선택 사항
- Docker & Docker Compose (Docker 설치 방법 사용 시)
- Nginx (리버스 프록시 사용 시)

### 네트워크 포트

다음 포트들이 열려 있어야 합니다:

| 포트 | 프로토콜 | 용도 |
|------|---------|------|
| 443 | TCP | HTTPS/WSS (프로덕션) |
| 3000 | TCP | 시그널링 서버 (개발) |
| 8088 | TCP | Janus HTTP API |
| 8089 | TCP | Janus HTTPS API |
| 8188 | TCP | Janus WebSocket |
| 8989 | TCP | Janus WSS |
| 40000-40099 | TCP | RTP/SRTP over TCP |

## 설치 방법

### 방법 1: Docker 사용 (권장)

Docker를 사용하면 모든 의존성이 포함된 컨테이너로 쉽게 배포할 수 있습니다.

#### 1.1. Docker 설치

```bash
# Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose 설치
sudo apt-get install docker-compose-plugin

# 현재 사용자를 docker 그룹에 추가
sudo usermod -aG docker $USER
newgrp docker
```

#### 1.2. 프로젝트 클론

```bash
git clone <repository-url>
cd webapp
```

#### 1.3. 환경 변수 설정

```bash
cp .env.example .env
nano .env
```

필수 설정 항목:
- `PUBLIC_IP`: 서버의 공인 IP 주소
- `JANUS_API_SECRET`: 랜덤 문자열 (보안)
- `JANUS_ADMIN_SECRET`: 랜덤 문자열 (보안)

#### 1.4. SSL 인증서 준비

**개발 환경:**
```bash
bash scripts/generate_certs.sh
```

**프로덕션 환경:**
```bash
# Let's Encrypt 사용
sudo apt-get install certbot
sudo certbot certonly --standalone -d your-domain.com

# 인증서를 certs 디렉토리에 복사
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./certs/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./certs/key.pem
sudo chown $USER:$USER ./certs/*.pem
```

#### 1.5. 컨테이너 빌드 및 실행

```bash
# 빌드
docker-compose build

# 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

#### 1.6. 컨테이너 관리

```bash
# 상태 확인
docker-compose ps

# 중지
docker-compose stop

# 재시작
docker-compose restart

# 제거
docker-compose down
```

### 방법 2: 수동 설치

직접 시스템에 설치하는 방법입니다.

#### 2.1. Node.js 설치

```bash
# Node.js 20 설치
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 버전 확인
node -v
npm -v
```

#### 2.2. 시스템 의존성 설치

```bash
cd webapp
sudo bash scripts/install_dependencies.sh
```

이 스크립트는 다음을 설치합니다:
- 빌드 도구 (gcc, make 등)
- libnice (ICE/STUN/TURN)
- libsrtp2 (SRTP 암호화)
- libjansson (JSON 파싱)
- 기타 Janus 의존성

#### 2.3. libnice 설치

```bash
bash scripts/install_libnice.sh
```

#### 2.4. Janus Gateway 설치

```bash
bash scripts/install_janus.sh
```

설치 시간: 약 10-15분 소요

#### 2.5. Janus 설정

```bash
bash scripts/setup_janus.sh
```

이 스크립트는:
1. 설정 파일을 `/opt/janus/etc/janus`로 복사
2. API Secret 자동 생성
3. 공인 IP 설정 (입력 시)
4. `.env` 파일 업데이트

#### 2.6. Node.js 애플리케이션 설치

```bash
# 의존성 설치
npm install

# SSL 인증서 생성 (개발용)
bash scripts/generate_certs.sh

# 환경 변수 설정
cp .env.example .env
nano .env
```

#### 2.7. 서비스 시작

```bash
# Janus 시작
bash scripts/start_janus.sh

# 시그널링 서버 시작
npm start
```

## 설정

### 환경 변수 상세

`.env` 파일의 주요 설정:

```env
# 서버 설정
PORT=3000                    # 시그널링 서버 포트
NODE_ENV=production          # 환경 (development/production)

# Janus 설정
JANUS_URL=https://localhost:8089/janus
JANUS_WS_URL=wss://localhost:8989
JANUS_API_SECRET=<생성된-secret>
JANUS_ADMIN_SECRET=<생성된-secret>

# 공인 IP (필수!)
PUBLIC_IP=123.456.789.012

# SSL 인증서
SSL_CERT_PATH=./certs/cert.pem
SSL_KEY_PATH=./certs/key.pem

# 녹화 설정
RECORDING_DIR=./recordings
ENABLE_RECORDING=true

# 세션 타임아웃 (밀리초)
SESSION_TIMEOUT=1800000      # 30분
```

### Janus 설정 커스터마이징

#### 비트레이트 조정

`janus-config/janus.plugin.videoroom.jcfg`:

```ini
bitrate = 1000000     # 1Mbps (기본)
# bitrate = 2000000   # 2Mbps (고화질)
# bitrate = 500000    # 500Kbps (저화질)
```

#### 포트 범위 변경

`janus-config/janus.jcfg`:

```ini
rtp_min_port = 40000
rtp_max_port = 40099
```

#### TURN 서버 설정 (NAT 환경)

`janus-config/janus.jcfg`:

```ini
turn_server = "turn:your-turn-server.com:3478"
turn_user = "username"
turn_pwd = "password"
turn_type = "tcp"
```

## 검증

### 1. Janus 상태 확인

```bash
# 프로세스 확인
ps aux | grep janus

# 로그 확인
tail -f logs/janus.log

# API 테스트
curl -k https://localhost:8089/janus
```

예상 응답:
```json
{
  "janus": "server_info",
  "name": "Janus WebRTC Server",
  ...
}
```

### 2. 시그널링 서버 확인

```bash
# 헬스 체크
curl -k https://localhost:3000/health

# 시스템 상태
curl -k https://localhost:3000/api/status
```

### 3. 방화벽 확인

```bash
# 열린 포트 확인
sudo netstat -tulpn | grep -E '3000|8089|8989|40000'

# UFW 상태 (사용 시)
sudo ufw status
```

### 4. 브라우저 테스트

1. 브라우저에서 `https://localhost:3000` 접속
2. 자체 서명 인증서 경고 → "고급" → "계속 진행"
3. 역할 선택 화면이 표시되면 성공!

## 문제 해결

### Janus가 시작되지 않음

**증상**: `bash scripts/start_janus.sh` 실행 시 오류

**해결책**:
```bash
# 로그 확인
cat logs/janus.log

# 포트 충돌 확인
sudo netstat -tulpn | grep -E '8088|8089'

# 설정 파일 검증
/opt/janus/bin/janus --config=/opt/janus/etc/janus/janus.jcfg --check
```

### 카메라/마이크 권한 오류

**증상**: 브라우저에서 미디어 접근 실패

**해결책**:
- HTTPS 연결 필수 (HTTP는 불가)
- 브라우저 설정에서 카메라/마이크 권한 확인
- 다른 앱이 카메라를 사용 중인지 확인

### ICE 연결 실패

**증상**: 비디오가 연결되지 않음

**해결책**:
```bash
# 공인 IP 확인
curl ifconfig.me

# .env 파일 업데이트
PUBLIC_IP=<확인된-공인-IP>

# Janus 재시작
bash scripts/stop_janus.sh
bash scripts/start_janus.sh
```

### 포트가 이미 사용 중

**증상**: `EADDRINUSE` 오류

**해결책**:
```bash
# 포트 사용 프로세스 확인
sudo lsof -i :3000
sudo lsof -i :8089

# 프로세스 종료
kill -9 <PID>
```

### SSL 인증서 오류

**증상**: SSL 관련 오류 발생

**해결책**:
```bash
# 인증서 확인
ls -la certs/

# 권한 확인
chmod 600 certs/key.pem
chmod 644 certs/cert.pem

# 인증서 재생성
bash scripts/generate_certs.sh
```

## systemd 서비스 등록 (선택사항)

프로덕션 환경에서 자동 시작을 위한 systemd 서비스:

### Janus 서비스

```bash
sudo nano /etc/systemd/system/janus.service
```

```ini
[Unit]
Description=Janus WebRTC Gateway
After=network.target

[Service]
Type=simple
User=root
ExecStart=/opt/janus/bin/janus --config=/opt/janus/etc/janus/janus.jcfg --log-file=/home/user/webapp/logs/janus.log
Restart=always

[Install]
WantedBy=multi-user.target
```

### 시그널링 서버 서비스

```bash
sudo nano /etc/systemd/system/face-auth-server.service
```

```ini
[Unit]
Description=Face Authentication Signaling Server
After=network.target janus.service

[Service]
Type=simple
User=user
WorkingDirectory=/home/user/webapp
ExecStart=/usr/bin/node /home/user/webapp/server/index.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### 서비스 활성화

```bash
# 서비스 리로드
sudo systemctl daemon-reload

# 서비스 시작
sudo systemctl start janus
sudo systemctl start face-auth-server

# 자동 시작 활성화
sudo systemctl enable janus
sudo systemctl enable face-auth-server

# 상태 확인
sudo systemctl status janus
sudo systemctl status face-auth-server
```

## 다음 단계

설치가 완료되었습니다! 이제:

1. [사용 가이드](USAGE.md)를 참고하여 시스템을 사용해보세요
2. [보안 가이드](SECURITY.md)로 보안 설정을 강화하세요
3. [문제 해결 가이드](TROUBLESHOOTING.md)를 북마크하세요

## 지원

문제가 발생하면:
1. 로그 파일 확인 (`logs/janus.log`, 콘솔 로그)
2. 이슈 트래커에서 검색
3. 새 이슈 생성 (로그 포함)
