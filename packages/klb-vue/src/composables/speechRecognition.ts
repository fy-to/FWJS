import { ref } from "vue";

export function useSpeechRecognition(
  onTextAvailableCallback: (text: string) => void,
  language: string = "en-US",
  silenceDuration: number = 2000,
) {
  console.log("useSpeechRecognition", language, silenceDuration);
  // @ts-ignore
  const recognition = new (window.SpeechRecognition ||
    // @ts-ignore
    window.webkitSpeechRecognition)();
  const isRecording = ref(false);
  let silenceTimeout: any | null = null;
  let transcript = "";

  recognition.lang = language;
  recognition.interimResults = false;
  recognition.continuous = true;

  recognition.onstart = () => {
    isRecording.value = true;
  };

  recognition.onend = () => {
    if (transcript) {
      isRecording.value = false;
      onTextAvailableCallback(transcript);
      transcript = "";
    } else {
      recognition.start();
    }
  };

  recognition.onerror = (event: any) => {
    console.error("SpeechRecognition error", event);
  };

  recognition.onresult = (event: any) => {
    console.log("SpeechRecognition result", event);
    clearTimeout(silenceTimeout);
    silenceTimeout = setTimeout(() => {
      stopRecording();
    }, silenceDuration);

    const current = event.resultIndex;
    const result = event.results[current];
    if (result.isFinal) {
      transcript += result[0].transcript;
    }
  };

  const changeLanguage = (newLanguage: string) => {
    recognition.lang = newLanguage;
  };

  const startRecording = () => {
    if (
      !("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    ) {
      throw new Error("Speech recognition is not supported in this browser.");
    }

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => {
        recognition.start();
        console.log("Microphone permission granted, start listening.");
      })
      .catch((error) => {
        console.error("Microphone permission denied", error);
      });
  };

  const stopRecording = () => {
    recognition.stop();
    if (silenceTimeout) {
      clearTimeout(silenceTimeout);
      silenceTimeout = null;
    }
  };

  const resumeRecording = () => {
    if (isRecording.value) {
      stopRecording();
    }
    startRecording();
  };

  return {
    startRecording,
    stopRecording,
    isRecording,
    resumeRecording,
    changeLanguage,
  };
}
