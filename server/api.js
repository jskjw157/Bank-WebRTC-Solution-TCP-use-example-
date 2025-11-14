import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const router = express.Router();

// 세션 정보 저장 (메모리)
const activeSessions = new Map();

/**
 * 새 세션 생성
 */
router.post('/sessions', (req, res) => {
  const { roomId, customerName, agentName } = req.body;
  
  if (!roomId) {
    return res.status(400).json({ error: 'roomId는 필수입니다' });
  }
  
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  const session = {
    sessionId,
    roomId,
    customerName: customerName || '고객',
    agentName: agentName || '상담원',
    status: 'waiting',
    createdAt: new Date().toISOString(),
    participants: []
  };
  
  activeSessions.set(sessionId, session);
  
  res.json({
    success: true,
    session
  });
});

/**
 * 세션 목록 조회
 */
router.get('/sessions', (req, res) => {
  const sessions = Array.from(activeSessions.values());
  
  res.json({
    success: true,
    count: sessions.length,
    sessions
  });
});

/**
 * 특정 세션 조회
 */
router.get('/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  const session = activeSessions.get(sessionId);
  
  if (!session) {
    return res.status(404).json({
      success: false,
      error: '세션을 찾을 수 없습니다'
    });
  }
  
  res.json({
    success: true,
    session
  });
});

/**
 * 세션 상태 업데이트
 */
router.patch('/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const { status, participants } = req.body;
  
  const session = activeSessions.get(sessionId);
  
  if (!session) {
    return res.status(404).json({
      success: false,
      error: '세션을 찾을 수 없습니다'
    });
  }
  
  if (status) session.status = status;
  if (participants) session.participants = participants;
  session.updatedAt = new Date().toISOString();
  
  activeSessions.set(sessionId, session);
  
  res.json({
    success: true,
    session
  });
});

/**
 * 세션 종료
 */
router.delete('/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  const session = activeSessions.get(sessionId);
  
  if (!session) {
    return res.status(404).json({
      success: false,
      error: '세션을 찾을 수 없습니다'
    });
  }
  
  session.status = 'completed';
  session.endedAt = new Date().toISOString();
  
  // 실제로는 삭제하지 않고 상태만 변경 (로그 유지)
  activeSessions.set(sessionId, session);
  
  res.json({
    success: true,
    message: '세션이 종료되었습니다',
    session
  });
});

/**
 * 녹화 파일 목록
 */
router.get('/recordings', (req, res) => {
  const recordingDir = process.env.RECORDING_DIR || path.join(__dirname, '..', 'recordings');
  
  if (!fs.existsSync(recordingDir)) {
    return res.json({
      success: true,
      recordings: []
    });
  }
  
  const files = fs.readdirSync(recordingDir)
    .filter(file => file.endsWith('.mjr') || file.endsWith('.webm') || file.endsWith('.mp4'))
    .map(file => {
      const filePath = path.join(recordingDir, file);
      const stats = fs.statSync(filePath);
      
      return {
        filename: file,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    })
    .sort((a, b) => b.modified - a.modified);
  
  res.json({
    success: true,
    count: files.length,
    recordings: files
  });
});

/**
 * 시스템 상태
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    status: 'operational',
    timestamp: new Date().toISOString(),
    activeSessions: activeSessions.size,
    janus: {
      url: process.env.JANUS_URL || 'https://localhost:8089/janus',
      wsUrl: process.env.JANUS_WS_URL || 'wss://localhost:8989'
    },
    recording: {
      enabled: process.env.ENABLE_RECORDING === 'true',
      directory: process.env.RECORDING_DIR || './recordings'
    }
  });
});

/**
 * 설정 정보
 */
router.get('/config', (req, res) => {
  res.json({
    success: true,
    config: {
      janusUrl: process.env.JANUS_URL || 'https://localhost:8089/janus',
      janusWsUrl: process.env.JANUS_WS_URL || 'wss://localhost:8989',
      publicIp: process.env.PUBLIC_IP || 'localhost',
      sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 1800000,
      recordingEnabled: process.env.ENABLE_RECORDING === 'true'
    }
  });
});
