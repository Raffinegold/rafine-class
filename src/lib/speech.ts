let cachedVoices: SpeechSynthesisVoice[] = [];

function loadVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  cachedVoices = window.speechSynthesis.getVoices();
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

/** Web Speech API로 영단어 발음 재생 (음원 파일 없이 무료) */
export function speak(text: string, rate = 0.9) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    utter.rate = rate;
    const preferred =
      cachedVoices.find((v) => /en-US/i.test(v.lang) && /Samantha|Google|Microsoft/i.test(v.name)) ??
      cachedVoices.find((v) => /en-US/i.test(v.lang)) ??
      cachedVoices.find((v) => /^en/i.test(v.lang));
    if (preferred) utter.voice = preferred;
    window.speechSynthesis.speak(utter);
    return true;
  } catch {
    return false;
  }
}

export function speechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}
