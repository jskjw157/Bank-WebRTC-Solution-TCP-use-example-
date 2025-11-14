# 🏦 금융권 TCP 화상인증 시스템

Janus WebRTC Gateway 기반의 금융권 화상 얼굴 인증 시스템입니다.
TCP 전용 통신을 지원하며, 보안이 강화된 1:1 화상 통화 기능을 제공합니다.

## ✨ 주요 기능

- 🔒 **TCP 전용 통신**: UDP 없이 TCP만 사용하여 방화벽 환경에서 안전하게 작동
- 👥 **1:1 화상 통화**: 고객과 상담원 간 실시간 화상 인증
- 🎥 **HD 화질 지원**: 최대 1280x720 해상도 지원
- 📹 **자동 녹화**: 화상 인증 세션 자동 녹화 (선택 사항)
- 🔐 **보안 강화**: HTTPS/WSS 암호화 통신, API Secret 인증
- 📱 **반응형 디자인**: 데스크톱 및 모바일 환경 지원
- 🎛️ **실시간 제어**: 마이크/카메라 켜기/끄기 기능

## 🏗️ 시스템 아키텍처

```
┌─────────────┐         WSS          ┌─────────────┐
│   고객 웹   │ ◄──────────────────► │             │
│  브라우저   │                      │  시그널링   │
└─────────────┘                      │   서버      │
                                     │  (Node.js)  │
┌─────────────┐         WSS          │             │
│  상담원 웹  │ ◄──────────────────► └─────────────┘
│  브라우저   │                             │
└─────────────┘                             │ HTTP API
                                            ▼
      │                            ┌─────────────┐
      │         TCP/ICE            │    Janus    │
      └────────────────────────────┤   Gateway   │
                                   │  (WebRTC)   │
                                   └─────────────┘
```

## 📋 시스템 요구사항

### 서버
- **OS**: Ubuntu 20.04 / 22.04 LTS (권장)
- **CPU**: 2 Core 이상
- **RAM**: 4GB 이상
- **디스크**: 20GB 이상 (녹화 저장 공간 포함)
- **네트워크**: 
  - TCP 443 포트 (HTTPS/WSS)
  - TCP 40000-40099 포트 (RTP/SRTP over TCP)

### 클라이언트
- **브라우저**: Chrome 90+, Firefox 88+, Edge 90+
- **카메라**: 720p 이상 권장
- **마이크**: 필수
- **네트워크**: 안정적인 인터넷 연결 (최소 1Mbps)

## 🚀 빠른 시작

### 1. 저장소 클론

```bash
git clone <repository-url>
cd webapp
```

### 2. Node.js 의존성 설치

```bash
npm install
```

### 3. SSL 인증서 생성 (개발용)

```bash
bash scripts/generate_certs.sh
```

### 4. 환경 변수 설정

```bash
cp .env.example .env
# .env 파일을 편집하여 필요한 값을 설정하세요
```

### 5. 시그널링 서버 시작

```bash
npm run dev
```

서버가 https://localhost:3000 에서 시작됩니다.

## 🔧 Janus Gateway 설치 (선택사항)

실제 WebRTC 미디어 서버로 Janus Gateway를 사용하려면:

### 1. 시스템 의존성 설치

```bash
sudo bash scripts/install_dependencies.sh
```

### 2. libnice 설치

```bash
bash scripts/install_libnice.sh
```

### 3. Janus 설치

```bash
bash scripts/install_janus.sh
```

### 4. Janus 설정

```bash
bash scripts/setup_janus.sh
```

### 5. Janus 시작

```bash
bash scripts/start_janus.sh
```

### 6. Janus 종료

```bash
bash scripts/stop_janus.sh
```

## 📖 사용 방법

### 고객 (본인 확인)

1. 브라우저에서 시스템 접속
2. **고객** 역할 선택
3. 방 번호와 이름 입력
4. 카메라/마이크 권한 허용
5. 상담원 입장 대기
6. 화상 인증 진행

### 상담원 (본인 확인 진행)

1. 브라우저에서 시스템 접속
2. **상담원** 역할 선택
3. 고객과 동일한 방 번호 입력
4. 카메라/마이크 권한 허용
5. 고객 화면 확인
6. 본인 확인 진행

## 🔐 보안 설정

### API Secret 변경

`.env` 파일에서 다음 값들을 변경하세요:

```env
JANUS_API_SECRET=your_secure_api_secret
JANUS_ADMIN_SECRET=your_secure_admin_secret
```

### 프로덕션 SSL 인증서

개발용 자체 서명 인증서 대신 Let's Encrypt를 사용하세요:

```bash
# Certbot 설치
sudo apt install certbot

# 인증서 발급
sudo certbot certonly --standalone -d your-domain.com

# 인증서 경로를 .env에 설정
SSL_CERT_PATH=/etc/letsencrypt/live/your-domain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/your-domain.com/privkey.pem
```

### 방화벽 설정

```bash
# UFW 사용 시
sudo ufw allow 443/tcp
sudo ufw allow 40000:40099/tcp
sudo ufw enable
```

## 📁 프로젝트 구조

```
webapp/
├── client/                 # 클라이언트 코드
│   ├── index.html         # 메인 HTML
│   ├── styles.css         # 스타일시트
│   └── app.js             # 클라이언트 로직
├── server/                # 서버 코드
│   ├── index.js           # 메인 서버
│   ├── signaling.js       # 시그널링 로직
│   └── api.js             # REST API
├── janus-config/          # Janus 설정 파일
│   ├── janus.jcfg
│   ├── janus.transport.http.jcfg
│   └── janus.plugin.videoroom.jcfg
├── scripts/               # 유틸리티 스크립트
│   ├── generate_certs.sh
│   ├── install_dependencies.sh
│   ├── install_janus.sh
│   ├── setup_janus.sh
│   ├── start_janus.sh
│   └── stop_janus.sh
├── certs/                 # SSL 인증서
├── logs/                  # 로그 파일
├── recordings/            # 녹화 파일
├── docs/                  # 문서
├── package.json
├── .env.example
└── README.md
```

## 🔌 API 엔드포인트

### 세션 관리

- `POST /api/sessions` - 새 세션 생성
- `GET /api/sessions` - 세션 목록 조회
- `GET /api/sessions/:id` - 특정 세션 조회
- `PATCH /api/sessions/:id` - 세션 상태 업데이트
- `DELETE /api/sessions/:id` - 세션 종료

### 시스템 정보

- `GET /api/status` - 시스템 상태 조회
- `GET /api/config` - 설정 정보 조회
- `GET /api/recordings` - 녹화 파일 목록

### 헬스 체크

- `GET /health` - 서버 상태 확인

## 🎛️ 환경 변수

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `PORT` | 서버 포트 | `3000` |
| `NODE_ENV` | 환경 | `development` |
| `JANUS_URL` | Janus HTTP API URL | `https://localhost:8089/janus` |
| `JANUS_WS_URL` | Janus WebSocket URL | `wss://localhost:8989` |
| `JANUS_API_SECRET` | Janus API Secret | - |
| `PUBLIC_IP` | 공인 IP | - |
| `RECORDING_DIR` | 녹화 저장 경로 | `./recordings` |
| `ENABLE_RECORDING` | 녹화 활성화 | `true` |
| `SESSION_TIMEOUT` | 세션 타임아웃 (ms) | `1800000` |

## 🐛 문제 해결

### 카메라/마이크 권한 오류

- HTTPS 연결 확인
- 브라우저 권한 설정 확인
- 다른 앱이 카메라/마이크를 사용 중인지 확인

### 연결 실패

- Janus Gateway가 실행 중인지 확인: `ps aux | grep janus`
- 로그 확인: `tail -f logs/janus.log`
- 방화벽 설정 확인
- 공인 IP 설정 확인

### 비디오가 보이지 않음

- 브라우저 콘솔에서 오류 확인
- ICE 연결 상태 확인
- NAT 설정 확인

## 📊 성능 최적화

### 비트레이트 조정

`janus-config/janus.plugin.videoroom.jcfg` 파일에서:

```ini
bitrate = 1000000  # 1Mbps (기본)
```

### 해상도 조정

`client/app.js` 파일에서:

```javascript
video: {
  width: { ideal: 1280 },   // 해상도 조정
  height: { ideal: 720 }
}
```

## 🧪 테스트

### 로컬 테스트

1. 두 개의 브라우저 창 열기
2. 하나는 고객, 하나는 상담원으로 입장
3. 동일한 방 번호 사용
4. 화상 통화 테스트

### 프로덕션 배포 전 체크리스트

- [ ] SSL 인증서 설정 완료
- [ ] API Secret 변경 완료
- [ ] 방화벽 포트 오픈 완료
- [ ] 공인 IP 설정 완료
- [ ] 녹화 디렉토리 권한 설정
- [ ] 로그 로테이션 설정
- [ ] 모니터링 설정

## 📝 라이센스

MIT License

## 🤝 기여

이슈와 PR을 환영합니다!

## 📧 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해주세요.

---

**Powered by Janus WebRTC Gateway**
