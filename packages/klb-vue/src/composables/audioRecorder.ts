import { ref } from 'vue'

export function useAudioRecorder(
  onAudioAvailableCallback: (chunks: Blob) => void,
  dbTreshold: number,
  silenceMinLength: number,
) {
  const audioContext = ref<AudioContext | null>(null)
  const mediaRecorder = ref<MediaRecorder | null>(null)
  const analyser = ref<AnalyserNode | null>(null)
  const recording = ref(false)
  const silenceStart = ref(performance.now())
  const isSilent = ref(false)
  const hasAudioBeenRecorded = ref(false)
  const shouldCallOnAudioAvailable = ref(false)
  console.log('init object')

  const isRecording = () => {
    return mediaRecorder.value && mediaRecorder.value.state === 'recording'
  }

  const rmsToDecibels = (rms: number) => {
    return 20 * Math.log10(rms)
  }
  const processAudioStream = () => {
    if (!audioContext.value || !analyser.value) {
      return
    }
    const bufferLength = analyser.value.fftSize
    const dataArray = new Uint8Array(bufferLength)

    const checkAudio = () => {
      if (!audioContext.value || !analyser.value) {
        return
      }
      analyser.value.getByteTimeDomainData(dataArray)
      let sum = 0
      for (let i = 0; i < bufferLength; i++) {
        const x = dataArray[i] / 128.0 - 1
        sum += x * x
      }
      const rms = Math.sqrt(sum / bufferLength)
      const db = rmsToDecibels(rms)
      if (db < dbTreshold) {
        if (!isSilent.value) {
          silenceStart.value = performance.now()
          isSilent.value = true
        }
        else if (performance.now() - silenceStart.value > silenceMinLength) {
          if (hasAudioBeenRecorded.value) {
            // Only proceed if non-silence audio data has been recorded

            if (!shouldCallOnAudioAvailable.value) {
              shouldCallOnAudioAvailable.value = true
              mediaRecorder.value?.stop() // stop() will trigger the dataavailable
            }
          }
        }
      }
      else {
        isSilent.value = false
        hasAudioBeenRecorded.value = true
      }

      if (recording.value) {
        requestAnimationFrame(checkAudio)
      }
    }

    checkAudio()
  }

  const startRecording = async () => {
    // Init everything

    recording.value = false
    hasAudioBeenRecorded.value = false
    isSilent.value = false
    silenceStart.value = performance.now()

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    if (!audioContext.value) {
      audioContext.value = new AudioContext()
    }
    const source = audioContext.value.createMediaStreamSource(stream)
    analyser.value = audioContext.value.createAnalyser()
    source.connect(analyser.value)

    mediaRecorder.value = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus',
    })

    mediaRecorder.value.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0) {
        onAudioAvailableCallback(event.data)
        stopRecording()
        shouldCallOnAudioAvailable.value = false
        silenceStart.value = performance.now()
      }
    })

    mediaRecorder.value.start()
    recording.value = true

    processAudioStream()
  }
  const stopRecording = async () => {
    recording.value = false
    hasAudioBeenRecorded.value = false
    isSilent.value = false
    silenceStart.value = performance.now()
    // destroy everything

    if (mediaRecorder.value) {
      mediaRecorder.value.ondataavailable = null
      mediaRecorder.value.stop()
      const stream = mediaRecorder.value.stream
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop()
        })
      }
      mediaRecorder.value = null
    }
    if (audioContext.value) {
      audioContext.value.close()
      audioContext.value = null
    }
    if (analyser.value) {
      analyser.value.disconnect()
      analyser.value = null
    }
    recording.value = false
  }

  const resumeRecording = () => {
    startRecording()
  }

  return {
    startRecording,
    stopRecording,
    isRecording,
    resumeRecording,
  }
}
