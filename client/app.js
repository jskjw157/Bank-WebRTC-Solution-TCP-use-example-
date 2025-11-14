// 전역 상태
const state = {
  role: null,
  roomId: null,
  displayName: null,
  janus: null,
  videoroom: null,
  subscriberHandle: null,
  localStream: null,
  remoteStream: null,
  isAudioEnabled: true,
  isVideoEnabled: true,
  callStartTime: null,
  durationInterval: null,
  ws: null
};

// 초기화
document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ 애플리케이션 초기화');
  
  // Janus 초기화
  Janus.init({
    debug: 'all',
    callback: () => {
      console.log('✅ Janus 라이브러리 초기화 완료');
    }
  });
  
  // 폼 이벤트 리스너
  document.getElementById('joinFormElement').addEventListener('submit', handleJoinForm);
  
  // 비디오 제어 버튼
  document.getElementById('toggleAudio').addEventListener('click', toggleAudio);
  document.getElementById('toggleVideo').addEventListener('click', toggleVideo);
  document.getElementById('endCall').addEventListener('click', endCall);
});

/**
 * 역할 선택
 */
function selectRole(role) {
  state.role = role;
  console.log(`👤 역할 선택: ${role}`);
  
  showScreen('joinForm');
}

/**
 * 입장 폼 제출
 */
function handleJoinForm(e) {
  e.preventDefault();
  
  state.roomId = document.getElementById('roomId').value;
  state.displayName = document.getElementById('displayName').value;
  
  console.log(`🚀 방 입장: ${state.roomId}, 이름: ${state.displayName}`);
  
  // 통화 화면으로 전환
  showScreen('callScreen');
  updateCallInfo();
  
  // WebRTC 초기화
  initializeWebRTC();
}

/**
 * WebRTC 초기화
 */
async function initializeWebRTC() {
  try {
    updateStatus('연결 중...', 'connecting');
    
    // 로컬 미디어 가져오기
    await getLocalMedia();
    
    // Janus 연결
    await connectToJanus();
    
  } catch (error) {
    console.error('❌ WebRTC 초기화 실패:', error);
    alert(`연결 실패: ${error.message}`);
    showScreen('roleSelection');
  }
}

/**
 * 로컬 미디어 스트림 가져오기
 */
async function getLocalMedia() {
  try {
    console.log('🎥 카메라 및 마이크 접근 중...');
    
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    
    state.localStream = stream;
    
    // 로컬 비디오에 연결
    const localVideo = document.getElementById('localVideo');
    localVideo.srcObject = stream;
    
    console.log('✅ 로컬 미디어 스트림 획득');
    
  } catch (error) {
    console.error('❌ 미디어 접근 실패:', error);
    throw new Error('카메라/마이크 접근 권한이 필요합니다');
  }
}

/**
 * Janus 서버 연결
 */
async function connectToJanus() {
  return new Promise((resolve, reject) => {
    // Janus 서버 URL (현재 서버와 동일한 호스트 사용)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const janusUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log(`🔌 Janus 연결 중: ${janusUrl}`);
    
    state.janus = new Janus({
      server: janusUrl,
      success: () => {
        console.log('✅ Janus 연결 성공');
        attachVideoRoomPlugin(resolve, reject);
      },
      error: (error) => {
        console.error('❌ Janus 연결 실패:', error);
        reject(new Error('서버 연결 실패'));
      },
      destroyed: () => {
        console.log('🔌 Janus 연결 종료');
      }
    });
  });
}

/**
 * VideoRoom 플러그인 연결
 */
function attachVideoRoomPlugin(resolve, reject) {
  state.janus.attach({
    plugin: 'janus.plugin.videoroom',
    
    success: (pluginHandle) => {
      state.videoroom = pluginHandle;
      console.log('✅ VideoRoom 플러그인 연결');
      
      // 방 참가
      joinRoom();
      resolve();
    },
    
    error: (error) => {
      console.error('❌ 플러그인 연결 실패:', error);
      reject(error);
    },
    
    onmessage: (msg, jsep) => {
      handleVideoRoomMessage(msg, jsep);
    },
    
    onlocalstream: (stream) => {
      console.log('🎥 로컬 스트림 수신');
      // 이미 getUserMedia로 처리했으므로 무시
    },
    
    onremotestream: (stream) => {
      console.log('📺 원격 스트림 수신');
      handleRemoteStream(stream);
    },
    
    oncleanup: () => {
      console.log('🧹 정리 중...');
    }
  });
}

/**
 * 방 참가
 */
function joinRoom() {
  console.log(`🚪 방 참가 시도: ${state.roomId}`);
  
  const register = {
    request: 'join',
    room: parseInt(state.roomId),
    ptype: 'publisher',
    display: state.displayName
  };
  
  state.videoroom.send({ message: register });
}

/**
 * VideoRoom 메시지 처리
 */
function handleVideoRoomMessage(msg, jsep) {
  console.log('📨 VideoRoom 메시지:', msg);
  
  const event = msg['videoroom'];
  
  if (event === 'joined') {
    // 방 참가 성공
    console.log('✅ 방 참가 성공');
    updateStatus('연결됨', 'connected');
    
    // 통화 시간 카운터 시작
    startCallDuration();
    
    // 로컬 스트림 발행
    publishOwnFeed();
    
    // 기존 참가자 확인
    if (msg['publishers']) {
      msg['publishers'].forEach(publisher => {
        console.log(`👥 기존 참가자: ${publisher.display}`);
        subscribeToFeed(publisher.id, publisher.display);
      });
    }
    
  } else if (event === 'event') {
    // 이벤트 처리
    if (msg['publishers']) {
      // 새 참가자 입장
      msg['publishers'].forEach(publisher => {
        console.log(`👋 새 참가자 입장: ${publisher.display}`);
        subscribeToFeed(publisher.id, publisher.display);
      });
    }
    
    if (msg['leaving']) {
      console.log(`👋 참가자 퇴장: ${msg['leaving']}`);
      // 원격 비디오 정리
      document.getElementById('waitingMessage').style.display = 'flex';
    }
    
  } else if (event === 'destroyed') {
    console.warn('⚠️ 방이 종료되었습니다');
    endCall();
  }
  
  // JSEP 처리
  if (jsep) {
    state.videoroom.handleRemoteJsep({ jsep });
  }
}

/**
 * 로컬 피드 발행
 */
function publishOwnFeed() {
  console.log('📤 로컬 스트림 발행 중...');
  
  state.videoroom.createOffer({
    media: {
      audioRecv: false,
      videoRecv: false,
      audioSend: true,
      videoSend: true,
      data: false
    },
    stream: state.localStream,
    // 🔥 TCP 전용 설정
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' }
    ],
    trickle: true,
    success: (jsep) => {
      console.log('✅ Offer 생성 성공');
      console.log('🔥 TCP 전용 모드로 SDP 생성됨');
      
      const publish = {
        request: 'configure',
        audio: true,
        video: true
      };
      
      state.videoroom.send({
        message: publish,
        jsep: jsep
      });
    },
    error: (error) => {
      console.error('❌ Offer 생성 실패:', error);
    }
  });
}

/**
 * 원격 피드 구독
 */
function subscribeToFeed(feedId, display) {
  console.log(`📥 피드 구독: ${feedId} (${display})`);
  
  state.janus.attach({
    plugin: 'janus.plugin.videoroom',
    
    success: (pluginHandle) => {
      state.subscriberHandle = pluginHandle;
      console.log('✅ Subscriber 플러그인 연결');
      
      const subscribe = {
        request: 'join',
        room: parseInt(state.roomId),
        ptype: 'subscriber',
        feed: feedId
      };
      
      state.subscriberHandle.send({ message: subscribe });
    },
    
    error: (error) => {
      console.error('❌ Subscriber 연결 실패:', error);
    },
    
    onmessage: (msg, jsep) => {
      console.log('📨 Subscriber 메시지:', msg);
      
      if (jsep) {
        state.subscriberHandle.createAnswer({
          jsep: jsep,
          media: { audioSend: false, videoSend: false },
          success: (jsep) => {
            const body = { request: 'start', room: parseInt(state.roomId) };
            state.subscriberHandle.send({ message: body, jsep: jsep });
          },
          error: (error) => {
            console.error('❌ Answer 생성 실패:', error);
          }
        });
      }
    },
    
    onremotestream: (stream) => {
      console.log('📺 원격 스트림 수신 (Subscriber)');
      handleRemoteStream(stream, display);
    }
  });
}

/**
 * 원격 스트림 처리
 */
function handleRemoteStream(stream, display) {
  state.remoteStream = stream;
  
  const remoteVideo = document.getElementById('remoteVideo');
  remoteVideo.srcObject = stream;
  
  // 대기 메시지 숨김
  document.getElementById('waitingMessage').style.display = 'none';
  
  // 원격 라벨 업데이트
  if (display) {
    document.getElementById('remoteLabel').textContent = display;
  }
  
  console.log('✅ 원격 비디오 연결 완료');
}

/**
 * 오디오 토글
 */
function toggleAudio() {
  if (!state.localStream) return;
  
  state.isAudioEnabled = !state.isAudioEnabled;
  
  state.localStream.getAudioTracks().forEach(track => {
    track.enabled = state.isAudioEnabled;
  });
  
  const btn = document.getElementById('toggleAudio');
  btn.textContent = state.isAudioEnabled ? '🎤' : '🔇';
  btn.classList.toggle('disabled', !state.isAudioEnabled);
  
  console.log(`🎤 오디오: ${state.isAudioEnabled ? 'ON' : 'OFF'}`);
}

/**
 * 비디오 토글
 */
function toggleVideo() {
  if (!state.localStream) return;
  
  state.isVideoEnabled = !state.isVideoEnabled;
  
  state.localStream.getVideoTracks().forEach(track => {
    track.enabled = state.isVideoEnabled;
  });
  
  const btn = document.getElementById('toggleVideo');
  btn.textContent = state.isVideoEnabled ? '📹' : '📷';
  btn.classList.toggle('disabled', !state.isVideoEnabled);
  
  console.log(`📹 비디오: ${state.isVideoEnabled ? 'ON' : 'OFF'}`);
}

/**
 * 통화 종료
 */
function endCall() {
  console.log('📞 통화 종료');
  
  // 통화 시간 카운터 중지
  if (state.durationInterval) {
    clearInterval(state.durationInterval);
  }
  
  // 최종 통화 시간 표시
  const duration = document.getElementById('callDuration').textContent;
  document.getElementById('finalDuration').textContent = duration;
  
  // 미디어 스트림 정리
  if (state.localStream) {
    state.localStream.getTracks().forEach(track => track.stop());
  }
  
  // Janus 정리
  if (state.videoroom) {
    state.videoroom.send({ message: { request: 'leave' } });
  }
  
  if (state.subscriberHandle) {
    state.subscriberHandle.detach();
  }
  
  if (state.janus) {
    state.janus.destroy();
  }
  
  // 종료 화면으로 전환
  showScreen('endScreen');
}

/**
 * 화면 전환
 */
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  
  document.getElementById(screenId).classList.add('active');
}

/**
 * 뒤로 가기
 */
function goBack(screenId) {
  showScreen(screenId);
}

/**
 * 통화 정보 업데이트
 */
function updateCallInfo() {
  document.getElementById('currentRoomId').textContent = state.roomId;
  document.getElementById('currentRole').textContent = 
    state.role === 'customer' ? '고객' : '상담원';
  document.getElementById('localLabel').textContent = state.displayName;
}

/**
 * 상태 업데이트
 */
function updateStatus(text, statusClass) {
  const statusEl = document.getElementById('connectionStatus');
  statusEl.textContent = text;
  statusEl.className = `status ${statusClass}`;
}

/**
 * 통화 시간 카운터 시작
 */
function startCallDuration() {
  state.callStartTime = Date.now();
  
  state.durationInterval = setInterval(() => {
    const elapsed = Date.now() - state.callStartTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    
    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    document.getElementById('callDuration').textContent = formatted;
  }, 1000);
}
