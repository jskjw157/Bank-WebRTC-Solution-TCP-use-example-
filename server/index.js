import express from 'express';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';
import { createSignalingServer } from './signaling.js';
import { router as apiRouter } from './api.js';

// ES 모듈에서 __dirname 사용
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 환경 변수 로드
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'client')));

// API 라우트
app.use('/api', apiRouter);

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Financial Face Authentication'
  });
});

// SSL 인증서 확인
const certPath = path.join(__dirname, '..', 'certs', 'cert.pem');
const keyPath = path.join(__dirname, '..', 'certs', 'key.pem');

let server;

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  // HTTPS 서버 생성
  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };
  
  server = https.createServer(httpsOptions, app);
  console.log('🔒 HTTPS 서버 시작');
} else {
  console.warn('⚠️  SSL 인증서가 없습니다. 개발용 인증서를 생성하세요.');
  console.warn('   실행: bash scripts/generate_certs.sh');
  
  // HTTP 서버 (개발용)
  const http = await import('http');
  server = http.createServer(app);
  console.log('⚠️  HTTP 서버 시작 (프로덕션에서는 HTTPS 필수!)');
}

// WebSocket 시그널링 서버 시작
createSignalingServer(server);

// 서버 시작
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   금융권 TCP 화상인증 시스템 (Janus WebRTC)                ║
║                                                            ║
║   서버 주소: https://localhost:${PORT}                        
║   시그널링: wss://localhost:${PORT}                          
║                                                            ║
║   상태: 실행 중 ✅                                          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
  
  console.log('\n📋 설정 확인:');
  console.log(`   - Janus URL: ${process.env.JANUS_URL || 'https://localhost:8089/janus'}`);
  console.log(`   - Janus WS: ${process.env.JANUS_WS_URL || 'wss://localhost:8989'}`);
  console.log(`   - 녹화 디렉토리: ${process.env.RECORDING_DIR || './recordings'}`);
  console.log(`   - 로그 레벨: ${process.env.LOG_LEVEL || 'info'}`);
  console.log('\n🚀 준비 완료! 브라우저에서 접속하세요.\n');
});

// 종료 핸들러
process.on('SIGTERM', () => {
  console.log('\n👋 서버 종료 중...');
  server.close(() => {
    console.log('✅ 서버가 정상적으로 종료되었습니다.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n👋 서버 종료 중...');
  server.close(() => {
    console.log('✅ 서버가 정상적으로 종료되었습니다.');
    process.exit(0);
  });
});
