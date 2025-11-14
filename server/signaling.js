import { WebSocketServer } from 'ws';
import axios from 'axios';
import https from 'https';
import { v4 as uuidv4 } from 'uuid';

// Janus API 설정
const JANUS_URL = process.env.JANUS_URL || 'https://localhost:8089/janus';
const API_SECRET = process.env.JANUS_API_SECRET;

// HTTPS Agent (자체 서명 인증서 허용)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// 세션 관리
const sessions = new Map(); // ws -> { sessionId, handleId, roomId, role }
const rooms = new Map(); // roomId -> Set<ws>

/**
 * Janus API 요청
 */
async function janusRequest(endpoint, body) {
  try {
    const url = `${JANUS_URL}${endpoint}`;
    const payload = API_SECRET ? { ...body, apisecret: API_SECRET } : body;
    
    const response = await axios.post(url, payload, { httpsAgent });
    
    if (response.data.janus === 'error') {
      throw new Error(response.data.error?.reason || 'Janus error');
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Janus API 오류:', error.message);
    throw error;
  }
}

/**
 * WebSocket 시그널링 서버 생성
 */
export function createSignalingServer(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  
  wss.on('connection', (ws) => {
    const clientId = uuidv4();
    console.log(`🔗 클라이언트 연결: ${clientId}`);
    
    let sessionData = {
      clientId,
      sessionId: null,
      handleId: null,
      roomId: null,
      role: null,
      display: null
    };
    
    sessions.set(ws, sessionData);
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        await handleMessage(ws, data, sessionData);
      } catch (error) {
        console.error('❌ 메시지 처리 오류:', error);
        sendError(ws, error.message);
      }
    });
    
    ws.on('close', async () => {
      await handleDisconnect(ws, sessionData);
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket 오류:', error);
    });
  });
  
  console.log('🔌 WebSocket 시그널링 서버 시작 (path: /ws)');
  return wss;
}

/**
 * 메시지 핸들러
 */
async function handleMessage(ws, data, sessionData) {
  const { type } = data;
  
  switch (type) {
    case 'create-session':
      await handleCreateSession(ws, data, sessionData);
      break;
      
    case 'attach-plugin':
      await handleAttachPlugin(ws, data, sessionData);
      break;
      
    case 'create-room':
      await handleCreateRoom(ws, data, sessionData);
      break;
      
    case 'join-room':
      await handleJoinRoom(ws, data, sessionData);
      break;
      
    case 'publish':
      await handlePublish(ws, data, sessionData);
      break;
      
    case 'subscribe':
      await handleSubscribe(ws, data, sessionData);
      break;
      
    case 'configure':
      await handleConfigure(ws, data, sessionData);
      break;
      
    case 'trickle':
      await handleTrickle(ws, data, sessionData);
      break;
      
    case 'leave':
      await handleLeave(ws, data, sessionData);
      break;
      
    default:
      console.warn('⚠️  알 수 없는 메시지 타입:', type);
  }
}

/**
 * 세션 생성
 */
async function handleCreateSession(ws, data, sessionData) {
  const result = await janusRequest('', {
    janus: 'create',
    transaction: generateTransactionId()
  });
  
  sessionData.sessionId = result.data.id;
  
  sendMessage(ws, {
    type: 'session-created',
    sessionId: result.data.id
  });
  
  console.log(`✅ 세션 생성: ${result.data.id}`);
}

/**
 * 플러그인 연결
 */
async function handleAttachPlugin(ws, data, sessionData) {
  const { sessionId } = sessionData;
  
  const result = await janusRequest(`/${sessionId}`, {
    janus: 'attach',
    plugin: 'janus.plugin.videoroom',
    transaction: generateTransactionId()
  });
  
  sessionData.handleId = result.data.id;
  
  sendMessage(ws, {
    type: 'plugin-attached',
    handleId: result.data.id
  });
  
  console.log(`✅ 플러그인 연결: ${result.data.id}`);
}

/**
 * 방 생성
 */
async function handleCreateRoom(ws, data, sessionData) {
  const { roomId, description, maxPublishers = 2 } = data;
  const { sessionId, handleId } = sessionData;
  
  const result = await janusRequest(`/${sessionId}/${handleId}`, {
    janus: 'message',
    body: {
      request: 'create',
      room: parseInt(roomId),
      description: description || `Face Auth Room ${roomId}`,
      publishers: maxPublishers,
      bitrate: 1000000,
      bitrate_cap: true,
      videocodec: 'h264,vp8',
      audiocodec: 'opus',
      record: process.env.ENABLE_RECORDING === 'true',
      rec_dir: process.env.RECORDING_DIR || './recordings',
      transport_wide_cc_ext: true
    },
    transaction: generateTransactionId()
  });
  
  rooms.set(roomId, new Set());
  
  sendMessage(ws, {
    type: 'room-created',
    roomId,
    data: result
  });
  
  console.log(`🏠 방 생성: ${roomId}`);
}

/**
 * 방 참가
 */
async function handleJoinRoom(ws, data, sessionData) {
  const { roomId, display, role } = data;
  const { sessionId, handleId } = sessionData;
  
  sessionData.roomId = roomId;
  sessionData.display = display;
  sessionData.role = role;
  
  const result = await janusRequest(`/${sessionId}/${handleId}`, {
    janus: 'message',
    body: {
      request: 'join',
      room: parseInt(roomId),
      ptype: 'publisher',
      display: display || role
    },
    transaction: generateTransactionId()
  });
  
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  rooms.get(roomId).add(ws);
  
  sendMessage(ws, {
    type: 'joined-room',
    roomId,
    role,
    data: result
  });
  
  // 방에 있는 다른 참가자들에게 알림
  broadcastToRoom(roomId, ws, {
    type: 'participant-joined',
    roomId,
    display,
    role
  });
  
  console.log(`👤 ${role} 방 참가: ${roomId}`);
}

/**
 * 스트림 발행
 */
async function handlePublish(ws, data, sessionData) {
  const { jsep, audio = true, video = true } = data;
  const { sessionId, handleId } = sessionData;
  
  const result = await janusRequest(`/${sessionId}/${handleId}`, {
    janus: 'message',
    body: {
      request: 'configure',
      audio,
      video
    },
    jsep,
    transaction: generateTransactionId()
  });
  
  sendMessage(ws, {
    type: 'published',
    jsep: result.jsep
  });
  
  console.log(`🎥 스트림 발행: ${sessionData.display}`);
}

/**
 * 스트림 구독
 */
async function handleSubscribe(ws, data, sessionData) {
  const { feed, jsep } = data;
  const { sessionId, handleId, roomId } = sessionData;
  
  const result = await janusRequest(`/${sessionId}/${handleId}`, {
    janus: 'message',
    body: {
      request: 'start',
      room: parseInt(roomId),
      feed: parseInt(feed)
    },
    jsep,
    transaction: generateTransactionId()
  });
  
  sendMessage(ws, {
    type: 'subscribed',
    feed,
    jsep: result.jsep
  });
  
  console.log(`📺 스트림 구독: feed ${feed}`);
}

/**
 * 설정 변경
 */
async function handleConfigure(ws, data, sessionData) {
  const { audio, video, jsep } = data;
  const { sessionId, handleId } = sessionData;
  
  const body = { request: 'configure' };
  if (audio !== undefined) body.audio = audio;
  if (video !== undefined) body.video = video;
  
  const result = await janusRequest(`/${sessionId}/${handleId}`, {
    janus: 'message',
    body,
    jsep,
    transaction: generateTransactionId()
  });
  
  sendMessage(ws, {
    type: 'configured',
    jsep: result.jsep
  });
}

/**
 * ICE Trickle
 */
async function handleTrickle(ws, data, sessionData) {
  const { candidate } = data;
  const { sessionId, handleId } = sessionData;
  
  await janusRequest(`/${sessionId}/${handleId}`, {
    janus: 'trickle',
    candidate,
    transaction: generateTransactionId()
  });
}

/**
 * 방 나가기
 */
async function handleLeave(ws, data, sessionData) {
  const { roomId } = sessionData;
  
  if (roomId && rooms.has(roomId)) {
    rooms.get(roomId).delete(ws);
    
    broadcastToRoom(roomId, ws, {
      type: 'participant-left',
      display: sessionData.display,
      role: sessionData.role
    });
  }
  
  sessionData.roomId = null;
  
  sendMessage(ws, { type: 'left' });
}

/**
 * 연결 종료 처리
 */
async function handleDisconnect(ws, sessionData) {
  const { sessionId, roomId, display, clientId } = sessionData;
  
  // 방에서 제거
  if (roomId && rooms.has(roomId)) {
    rooms.get(roomId).delete(ws);
    
    broadcastToRoom(roomId, ws, {
      type: 'participant-left',
      display,
      role: sessionData.role
    });
    
    if (rooms.get(roomId).size === 0) {
      rooms.delete(roomId);
    }
  }
  
  // Janus 세션 정리
  if (sessionId) {
    try {
      await janusRequest(`/${sessionId}`, {
        janus: 'destroy',
        transaction: generateTransactionId()
      });
    } catch (error) {
      // 무시
    }
  }
  
  sessions.delete(ws);
  console.log(`👋 클라이언트 연결 종료: ${clientId}`);
}

/**
 * 유틸리티 함수들
 */
function sendMessage(ws, message) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function sendError(ws, errorMessage) {
  sendMessage(ws, {
    type: 'error',
    message: errorMessage
  });
}

function broadcastToRoom(roomId, sender, message) {
  if (!rooms.has(roomId)) return;
  
  rooms.get(roomId).forEach((client) => {
    if (client !== sender && client.readyState === client.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

function generateTransactionId() {
  return Math.random().toString(36).substring(2, 15);
}
