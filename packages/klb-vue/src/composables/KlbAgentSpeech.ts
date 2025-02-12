import { computed, ref } from 'vue'
import { useEventBus } from './event-bus'
import { useRest } from './rest'
import { useSpeechRecognition } from './speechRecognition'

export function useKlbAgentSpeech(language = 'en-US') {
  const sessionStarted = ref(false)
  const videoElement = ref<HTMLVideoElement>()
  const idleVideoElement = ref<HTMLVideoElement>()
  const sessionData = ref<any>()
  const session = ref<any>()
  const peerConnection = ref<RTCPeerConnection | null>(null)
  const iceStatus = ref<any>()
  const peerStatus = ref<any>()
  const signalStatus = ref<any>()
  const bgImage = ref()
  const lastBytesReceived = ref(0)
  const sentCandidates = ref<any>([])
  const saying = ref(false)
  let statsIntervalId: any = null
  const videoIdleURL = ref()
  const rest = useRest()
  const eventBus = useEventBus()
  const onTextAvailableCallback = (text: string) => {
    rest(`HIAgent/Session/${session.value}:inputText`, 'POST', {
      text,
    }).catch((e) => {
      console.error('Failed to send text', e)
    })
  }
  const speechToText = useSpeechRecognition(
    onTextAvailableCallback,
    language,
    1000,
  )
  const isRecordingMic = computed(() => speechToText.isRecording.value)

  const getSession = async (agentId: string) => {
    eventBus.emit('main-loading', true)
    sessionStarted.value = true
    const r = await rest(`HIAgent/${agentId}/Session:get`, 'GET', {
      _expand: '/HIAgent',
    })

    if (r && r.result === 'success') {
      sessionData.value = r.data.Session
      session.value = r.data.HIAgent_Session__
      videoIdleURL.value = r.data.Idle_Url
      bgImage.value = r.data.Background
      if (r.data.HIAgent.Language__) {
        speechToText.changeLanguage(r.data.HIAgent.Language__)
      }
      setTimeout(() => {
        playIdleVideo()
      }, 1000)
      initializeWebRTC(r.data.Session)
    }
    else {
      sessionStarted.value = false
      eventBus.emit('main-loading', false)
    }
  }

  /*
  const onAudioAvailableCallback = (blob: Blob) => {
    const filename = `audio_${Date.now()}.webm` // Example filename with timestamp
    const file = new File([blob], filename, { type: 'audio/webm' })
    upload.append(`HIAgent/Session/${session.value}:input`, file)
    upload.run()
  }
  */
  const playIdleVideo = () => {
    if (!videoElement.value) return
    videoElement.value.classList.add('hidden')
    if (!isRecordingMic.value) {
      speechToText.startRecording()
    }
    if (!idleVideoElement.value) return

    if (idleVideoElement.value.src === videoIdleURL.value) {
      if (idleVideoElement.value.paused) {
        idleVideoElement.value.play().catch((e) => {
          console.error('Failed to play idle video', e)
        })
      }
      return
    }
    idleVideoElement.value.src = videoIdleURL.value
    idleVideoElement.value.loop = true
    idleVideoElement.value.muted = true
    idleVideoElement.value.play().catch((e) => {
      console.error('Failed to play idle video', e)
    })
  }
  const setVideoElement = (stream: MediaStream) => {
    if (!stream) return
    if (!videoElement.value) return

    if (!videoElement.value) return
    videoElement.value.classList.remove('hidden')
    videoElement.value.classList.add('animated')

    videoElement.value.muted = false

    videoElement.value.srcObject = stream
    videoElement.value.loop = false

    setTimeout(() => {
      videoElement.value?.classList.remove('animated')
    }, 1000)

    if (videoElement.value.paused) {
      videoElement.value
        .play()
        .then((_) => {})
        .catch(() => {})
    }
  }
  const sendSpd = async (spd: any) => {
    const r = await rest(`HIAgent/Session/${session.value}:sdp`, 'POST', spd)
    if (r && r.result === 'success') {
      return r.data
    }
    return null
  }
  const sendIce = async (ice: any) => {
    const r = await rest(`HIAgent/Session/${session.value}:ice`, 'POST', ice)
    if (r && r.result === 'success') {
      return r.data
    }
    return null
  }
  const sendSay = async (say: string) => {
    if (saying.value) return
    const r = await rest(`HIAgent/Session/${session.value}:say`, 'POST', {
      input: say,
    })
    if (r && r.result === 'success') {
      saying.value = true
      if (isRecordingMic.value) {
        speechToText.stopRecording()
      }
      return r.data
    }
    return null
  }
  const onIceCandidate = async (event: RTCPeerConnectionIceEvent) => {
    if (event.candidate) {
      if (
        sentCandidates.value.some(
          (c: any) => c.candidate === event.candidate?.candidate,
        )
      ) {
        return
      }
      const { candidate, sdpMid, sdpMLineIndex } = event.candidate

      const r = await sendIce({
        candidate,
        sdpMid,
        sdpMLineIndex,
      })
      if (r) {
        sentCandidates.value.push(event.candidate)
      }
    }
  }

  const onVideoStatusChange = (playing: boolean, stream: MediaStream) => {
    if (playing) {
      setVideoElement(stream)
    }
    else {
      playIdleVideo()
    }
  }
  const onTrack = (event: RTCTrackEvent) => {
    if (!event.track) return
    let playing = false
    statsIntervalId = setInterval(async () => {
      if (peerConnection.value === null || !event.track) return
      const stats = await peerConnection.value
        .getStats(event.track)
        .catch((e) => {
          console.error('Failed to get stats', e)
          return []
        })
      stats.forEach((report) => {
        if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
          const videoStatusChanged = playing !== (report.bytesReceived > lastBytesReceived.value)

          if (videoStatusChanged) {
            playing = report.bytesReceived > lastBytesReceived.value
            onVideoStatusChange(playing, event.streams[0])
          }
          lastBytesReceived.value = report.bytesReceived
        }
      })
    }, 500)
  }
  const onIceGatheringStateChange = () => {}

  const onSignalingStateChange = () => {
    signalStatus.value = peerConnection.value?.signalingState
  }
  const closePeerConnection = () => {
    if (statsIntervalId) {
      clearInterval(statsIntervalId)
      statsIntervalId = null
    }
    if (peerConnection.value) {
      peerConnection.value.close()
      peerConnection.value.removeEventListener(
        'icegatheringstatechange',
        onIceGatheringStateChange,
        true,
      )
      peerConnection.value.removeEventListener(
        'icecandidate',
        onIceCandidate,
        true,
      )
      peerConnection.value.removeEventListener(
        'iceconnectionstatechange',
        onIceConnectionStateChange,
        true,
      )
      peerConnection.value.removeEventListener(
        'connectionstatechange',
        onConnectionStateChange,
        true,
      )
      peerConnection.value.removeEventListener(
        'signalingstatechange',
        onSignalingStateChange,
        true,
      )

      peerConnection.value = null
    }
  }
  const onIceConnectionStateChange = () => {
    if (peerConnection.value) {
      if (
        peerConnection.value.iceConnectionState === 'failed'
        || peerConnection.value.iceConnectionState === 'closed'
      ) {
        stopAllStreams()
        closePeerConnection()
      }
      else {
        iceStatus.value = peerConnection.value?.iceConnectionState
      }
    }
  }
  const onConnectionStateChange = () => {
    if (peerConnection.value) {
      peerStatus.value = peerConnection.value?.connectionState
    }
  }
  const stopAllStreams = () => {
    if (videoElement.value && videoElement.value.srcObject) {
      // @ts-expect-error: srcObject is read-only
      videoElement.value.srcObject.getTracks().forEach(track => track.stop())
      videoElement.value.srcObject = null
    }
  }
  const initializeWebRTC = async (sessionData: any) => {
    peerConnection.value = new RTCPeerConnection({
      iceServers: sessionData.ice_servers,
    })

    peerConnection.value.addEventListener(
      'icegatheringstatechange',
      onIceGatheringStateChange,
      true,
    )
    peerConnection.value.addEventListener('icecandidate', onIceCandidate, true)
    peerConnection.value.addEventListener(
      'iceconnectionstatechange',
      onIceConnectionStateChange,
      true,
    )
    peerConnection.value.addEventListener(
      'connectionstatechange',
      onConnectionStateChange,
      true,
    )
    peerConnection.value.addEventListener(
      'signalingstatechange',
      onSignalingStateChange,
      true,
    )
    peerConnection.value.addEventListener('track', onTrack, true)
    await peerConnection.value.setRemoteDescription(sessionData.offer)
    const answer = await peerConnection.value.createAnswer()
    await peerConnection.value.setLocalDescription(answer)
    await sendSpd(answer)
    const dc = await peerConnection.value.createDataChannel('JanusDataChannel')
    dc.onopen = () => {
      if (!isRecordingMic.value) {
        speechToText.startRecording()
      }
      eventBus.emit('main-loading', false)
    }
    let decodedMsg
    dc.onmessage = (event) => {
      let msg = event.data
      const msgType = 'chat/answer:'
      if (msg.includes(msgType)) {
        msg = decodeURIComponent(msg.replace(msgType, ''))
        decodedMsg = msg
        return decodedMsg
      }
      if (msg === 'stream/started') {
        // console.log("stream started");
      }
      else if (msg === 'stream/done') {
        // console.log("stream done");
        playIdleVideo()
        saying.value = false
        if (!isRecordingMic.value) {
          speechToText.startRecording()
        }
      }
      else {
        // console.log("datachannel message", msg);
      }
    }

    dc.onclose = () => {
      // console.log("datachannel close");
    }
  }

  // const audioRecorder = useAudioRecorder(onAudioAvailableCallback, -20, 1000);

  return {
    getSession,
    closePeerConnection,
    sendSay,
    audioRecorder: speechToText,
    sessionStarted,
    iceStatus,
    peerStatus,
    signalStatus,
    isRecordingMic,
    bgImage,
    videoElement,
    idleVideoElement,
    saying,
  }
}
