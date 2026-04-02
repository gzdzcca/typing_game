// Letter pronunciation using the Web Speech API (works on all modern browsers + iPad)
// Speaks each letter when it becomes the "current" letter to type

const ALPHABET_NAMES: Record<string, string> = {
  a: "エー", b: "ビー", c: "シー", d: "ディー", e: "イー",
  f: "エフ", g: "ジー", h: "エイチ", i: "アイ", j: "ジェー",
  k: "ケー", l: "エル", m: "エム", n: "エヌ", o: "オー",
  p: "ピー", q: "キュー", r: "アール", s: "エス", t: "ティー",
  u: "ユー", v: "ブイ", w: "ダブリュー", x: "エックス", y: "ワイ",
  z: "ゼット",
};

let jaVoice: SpeechSynthesisVoice | null = null;
let voicesLoaded = false;

function loadVoices() {
  if (voicesLoaded) return;
  const voices = speechSynthesis.getVoices();
  // Prefer a Japanese female voice
  jaVoice =
    voices.find((v) => v.lang.startsWith("ja") && v.name.includes("female")) ??
    voices.find((v) => v.lang.startsWith("ja") && v.name.toLowerCase().includes("kyoko")) ??
    voices.find((v) => v.lang.startsWith("ja") && v.name.toLowerCase().includes("o-ren")) ??
    voices.find((v) => v.lang.startsWith("ja")) ??
    null;
  if (voices.length > 0) voicesLoaded = true;
}

// Voices load asynchronously on some browsers
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();
}

export function speakLetter(letter: string, mode: "alphabet" | "hiragana") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  loadVoices();

  // Cancel any ongoing speech
  speechSynthesis.cancel();

  let textToSpeak: string;
  if (mode === "alphabet") {
    textToSpeak = ALPHABET_NAMES[letter.toLowerCase()] ?? letter;
  } else {
    // Hiragana: just speak the character itself
    textToSpeak = letter;
  }

  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  utterance.lang = "ja-JP";
  utterance.rate = 0.8; // Slower for a child
  utterance.pitch = 1.3; // Higher pitch - cuter
  utterance.volume = 0.8;

  if (jaVoice) {
    utterance.voice = jaVoice;
  }

  speechSynthesis.speak(utterance);
}
