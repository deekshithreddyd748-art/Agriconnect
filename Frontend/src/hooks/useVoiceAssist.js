import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const LOCALE_TO_VOICE_LANG = {
  en: 'en-IN',
  kn: 'kn-IN',
  hi: 'hi-IN',
  te: 'te-IN',
  ta: 'ta-IN',
  mr: 'mr-IN',
};

export function useVoiceAssist() {
  const { i18n } = useTranslation();
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const supported =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance === 'function';

  const stop = useCallback(() => {
    if (!supported) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore speech cleanup failures cleanly
    }
    setSpeaking(false);
  }, [supported]);

  const speak = useCallback(
    (text) => {
      if (!supported || !text) return;
      try {
        window.speechSynthesis.cancel();
        const utterance = new window.SpeechSynthesisUtterance(String(text));
        utterance.lang = LOCALE_TO_VOICE_LANG[i18n.language] || 'en-IN';
        utterance.rate = 0.95;
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);
        setSpeaking(true);
        window.speechSynthesis.speak(utterance);
      } catch {
        setSpeaking(false);
      }
    },
    [i18n.language, supported]
  );

  useEffect(() => stop, [stop]);

  return {
    supported,
    voiceEnabled,
    speaking,
    setVoiceEnabled: (next) => {
      if (!next) stop();
      setVoiceEnabled(Boolean(next));
    },
    speak,
    stop,
  };
}
