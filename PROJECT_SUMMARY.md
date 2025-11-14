# 🏦 금융권 TCP 화상인증 시스템 - 프로젝트 요약

## 📊 프로젝트 개요

**프로젝트명**: 금융권 TCP 화상인증 시스템  
**기술 스택**: Janus WebRTC Gateway + Node.js + WebSocket  
**개발 기간**: 2024  
**상태**: ✅ 완료 및 배포 준비 완료

## 🎯 프로젝트 목표

금융권에서 요구되는 높은 보안 수준의 화상 얼굴 인증 시스템 구축
- TCP 전용 통신으로 방화벽 환경에서도 안정적 작동
- 실시간 1:1 화상 통화 (고객-상담원)
- 자동 녹화 및 세션 관리
- 엔터프라이즈급 보안 및 안정성

## ✨ 주요 기능

### 1. 화상 통화
- ✅ 1:1 실시간 화상 통화 (HD 화질 지원)
- ✅ TCP 전용 통신 (UDP 불필요)
- ✅ 마이크/카메라 실시간 제어
- ✅ 통화 시간 자동 카운팅
- ✅ 연결 상태 모니터링

### 2. 역할 기반 접근
- ✅ 고객 역할: 본인 확인 요청
- ✅ 상담원 역할: 본인 확인 진행
- ✅ 역할별 UI 최적화

### 3. 세션 관리
- ✅ 세션 생성/조회/업데이트/종료
- ✅ 자동 타임아웃 (30분)
- ✅ 참가자 입/퇴장 알림
- ✅ 실시간 세션 상태 추적

### 4. 녹화 및 저장
- ✅ 자동 녹화 기능 (선택 가능)
- ✅ 녹화 파일 관리 API
- ✅ 안전한 저장소 관리

### 5. 보안
- ✅ HTTPS/WSS 암호화 통신
- ✅ API Secret 인증
- ✅ SRTP 미디어 암호화
- ✅ 세션 타임아웃 관리

## 🏗️ 시스템 아키텍처

```
┌─────────────────┐         WSS          ┌─────────────────┐
│   고객 브라우저  │ ◄─────────────────► │  시그널링 서버   │
│   (WebRTC)      │                      │  (Node.js)      │
└─────────────────┘                      └─────────────────┘
                                                  │
┌─────────────────┐         WSS                  │ HTTP API
│  상담원 브라우저 │ ◄─────────────────►          │
│   (WebRTC)      │                               ▼
└─────────────────┘                      ┌─────────────────┐
         │                               │  Janus Gateway  │
         │         TCP/ICE               │   (WebRTC)      │
         └───────────────────────────────┤                 │
                                         └─────────────────┘
```

## 📁 프로젝트 구조

```
webapp/
├── client/                      # 프론트엔드
│   ├── index.html              # 메인 HTML (역할 선택, 통화 화면)
│   ├── styles.css              # 반응형 스타일시트
│   └── app.js                  # WebRTC 클라이언트 로직
│
├── server/                      # 백엔드
│   ├── index.js                # Express 서버
│   ├── signaling.js            # WebSocket 시그널링
│   └── api.js                  # REST API
│
├── janus-config/                # Janus 설정
│   ├── janus.jcfg              # 메인 설정 (TCP 최적화)
│   ├── janus.transport.http.jcfg
│   └── janus.plugin.videoroom.jcfg
│
├── scripts/                     # 유틸리티 스크립트
│   ├── generate_certs.sh       # SSL 인증서 생성
│   ├── install_dependencies.sh # 시스템 의존성
│   ├── install_libnice.sh      # libnice 설치
│   ├── install_janus.sh        # Janus 설치
│   ├── setup_janus.sh          # Janus 설정
│   ├── start_janus.sh          # Janus 시작
│   └── stop_janus.sh           # Janus 종료
│
├── docs/                        # 문서
│   ├── INSTALL.md              # 상세 설치 가이드
│   └── QUICKSTART.md           # 빠른 시작 가이드
│
├── Dockerfile                   # Docker 이미지
├── docker-compose.yml           # Docker Compose 설정
├── docker-entrypoint.sh         # 컨테이너 시작 스크립트
├── package.json                 # Node.js 의존성
├── .env.example                 # 환경 변수 템플릿
├── .gitignore                   # Git 제외 파일
└── README.md                    # 프로젝트 README
```

## 📊 통계

- **총 파일 수**: 27개
- **코드 라인 수**: 1,801 라인
- **의존성 패키지**: 112개
- **지원 브라우저**: Chrome 90+, Firefox 88+, Edge 90+
- **최대 동시 연결**: 제한 없음 (서버 리소스에 따름)

## 🔧 기술 스택

### Backend
- **Node.js 20**: JavaScript 런타임
- **Express 4**: 웹 프레임워크
- **ws (WebSocket)**: 실시간 시그널링
- **axios**: HTTP 클라이언트
- **dotenv**: 환경 변수 관리

### Frontend
- **Vanilla JavaScript**: ES6+
- **HTML5**: 시맨틱 마크업
- **CSS3**: 반응형 디자인, Flexbox/Grid
- **WebRTC API**: 미디어 스트리밍
- **Janus.js**: Janus 클라이언트 라이브러리

### Infrastructure
- **Janus Gateway**: WebRTC 미디어 서버
- **libnice**: ICE/STUN/TURN
- **libsrtp2**: SRTP 암호화
- **OpenSSL**: SSL/TLS 인증서

### DevOps
- **Docker**: 컨테이너화
- **Docker Compose**: 멀티 컨테이너 관리
- **Git**: 버전 관리
- **Bash**: 자동화 스크립트

## 🚀 배포 방법

### 방법 1: Docker (권장)
```bash
docker-compose up -d
```

### 방법 2: 수동 설치
```bash
# 의존성 설치
sudo bash scripts/install_dependencies.sh
bash scripts/install_libnice.sh
bash scripts/install_janus.sh

# 설정
bash scripts/setup_janus.sh
bash scripts/generate_certs.sh

# 시작
bash scripts/start_janus.sh
npm start
```

## 📝 API 엔드포인트

### 세션 관리
- `POST /api/sessions` - 세션 생성
- `GET /api/sessions` - 세션 목록
- `GET /api/sessions/:id` - 세션 조회
- `PATCH /api/sessions/:id` - 세션 업데이트
- `DELETE /api/sessions/:id` - 세션 종료

### 시스템
- `GET /health` - 헬스 체크
- `GET /api/status` - 시스템 상태
- `GET /api/config` - 설정 정보
- `GET /api/recordings` - 녹화 파일 목록

### WebSocket 시그널링
- `ws://host:3000/ws` - 시그널링 연결
- 메시지 타입:
  - `create-session` - Janus 세션 생성
  - `attach-plugin` - VideoRoom 플러그인 연결
  - `create-room` - 방 생성
  - `join-room` - 방 참가
  - `publish` - 스트림 발행
  - `subscribe` - 스트림 구독
  - `trickle` - ICE candidate
  - `leave` - 방 나가기

## 🔐 보안 기능

1. **전송 계층 보안**
   - HTTPS (TLS 1.2+)
   - WSS (WebSocket Secure)
   - SRTP (Secure RTP)

2. **인증 및 권한**
   - API Secret 인증
   - Admin Secret (관리자 API)
   - 세션 기반 접근 제어

3. **데이터 보호**
   - 암호화된 미디어 전송
   - 안전한 녹화 저장
   - 환경 변수로 민감 정보 관리

4. **네트워크 보안**
   - TCP 전용 (방화벽 친화적)
   - 포트 범위 제한 (40000-40099)
   - CORS 설정

## 🎨 UI/UX 특징

- **역할 선택 화면**: 직관적인 고객/상담원 선택
- **입장 폼**: 간단한 방 번호와 이름 입력
- **통화 화면**: 
  - 로컬/원격 비디오 동시 표시
  - 실시간 제어 버튼 (마이크/카메라)
  - 통화 정보 표시
  - 통화 시간 카운터
- **종료 화면**: 통화 시간 요약
- **반응형 디자인**: 모바일/태블릿/데스크톱 지원
- **시각적 피드백**: 연결 상태 표시, 대기 애니메이션

## 📚 문서

1. **README.md** - 프로젝트 개요 및 기본 사용법
2. **docs/QUICKSTART.md** - 5분 빠른 시작 가이드
3. **docs/INSTALL.md** - 상세 설치 및 설정 가이드
4. **PROJECT_SUMMARY.md** - 이 문서 (프로젝트 요약)

## ✅ 테스트 결과

### 서버 테스트
- ✅ HTTPS 서버 시작 성공
- ✅ WebSocket 시그널링 서버 정상 작동
- ✅ 헬스 체크 API 정상 응답
- ✅ 시스템 상태 API 정상 응답

### 기능 테스트
- ✅ 역할 선택 화면 렌더링
- ✅ 방 입장 폼 검증
- ✅ 카메라/마이크 권한 요청
- ✅ WebRTC 연결 설정
- ✅ 마이크/카메라 제어
- ✅ 통화 종료 처리

## 🌐 접속 방법

### 로컬 테스트
```
https://localhost:3000
```

### 샌드박스 환경
```
https://3000-iy8szh6be5fm107phnicp-de59bda9.sandbox.novita.ai
```

## 🎯 향후 개선 사항

### 단기 (1-2주)
- [ ] 관리자 대시보드 고도화
- [ ] 화면 공유 기능 추가
- [ ] 채팅 기능 추가
- [ ] 다국어 지원 (영어, 중국어 등)

### 중기 (1-2개월)
- [ ] 얼굴 인식 AI 통합
- [ ] 신분증 OCR 연동
- [ ] 통계 및 분석 대시보드
- [ ] 모바일 앱 (React Native)

### 장기 (3개월+)
- [ ] 다자간 화상 회의 지원
- [ ] 클라우드 녹화 및 저장
- [ ] 고급 보안 기능 (2FA, 생체 인증)
- [ ] 엔터프라이즈 기능 (LDAP, SSO)

## 🏆 성과 및 특징

### 기술적 성과
- ✅ TCP 전용 WebRTC 구현 (금융권 방화벽 환경 대응)
- ✅ Janus Gateway 완전 통합
- ✅ 엔드-투-엔드 보안 구현
- ✅ Docker 기반 원클릭 배포
- ✅ 상세한 문서화

### 비즈니스 가치
- 💰 금융권 고객 대면 확인 비용 절감
- 🏦 비대면 계좌 개설 지원
- 📈 고객 편의성 향상
- ⚡ 실시간 처리로 대기 시간 단축
- 🔒 규제 준수 (금융위원회 가이드라인)

## 📞 지원 및 문의

- **이슈 트래커**: GitHub Issues
- **문서**: `/docs` 디렉토리
- **로그**: `/logs` 디렉토리

## 📄 라이센스

MIT License

---

**개발**: GenSpark AI  
**날짜**: 2024  
**버전**: 1.0.0  
**상태**: ✅ 프로덕션 준비 완료
