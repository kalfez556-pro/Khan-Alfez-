// Web Audio API Ambient Sound Synthesizer & Acoustic Feedback

let audioCtx: AudioContext | null = null;
let currentAmbientNodes: {
  oscLeft?: OscillatorNode;
  oscRight?: OscillatorNode;
  noiseNode?: AudioNode;
  gainNode?: GainNode;
  filterNode?: BiquadFilterNode;
} | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a pleasant success chime (e.g. for QR Attendance verification or quiz completion)
 */
export function playSuccessChime() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now + 0.08); // A5
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.28); // D6

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.08);

    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  } catch (e) {
    console.warn('Audio feedback not available', e);
  }
}

/**
 * Play a crisp, unmistakable notification chime (for incoming notices, notes, assignments, or urgent alerts)
 */
export function playNotificationPing(
  variant: 'assignment' | 'note' | 'notice' | 'urgent' | 'default' = 'default'
) {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    // Select distinct pleasant chime frequencies depending on upload type
    const notes =
      variant === 'urgent'
        ? [880, 1174.66, 880, 1318.51] // Urgent double-bell attention chime
        : variant === 'assignment'
        ? [587.33, 880, 1174.66] // D5 -> A5 -> D6 bright chime
        : variant === 'note'
        ? [659.25, 987.77, 1318.51] // E5 -> B5 -> E6 crisp study chime
        : variant === 'notice'
        ? [523.25, 783.99, 1046.5] // C5 -> G5 -> C6 announcement bell
        : [659.25, 1046.5]; // E5 -> C6 standard two-tone chime

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = variant === 'urgent' ? 'triangle' : 'sine';
      const startTime = now + idx * (variant === 'urgent' ? 0.11 : 0.09);
      const duration = idx === notes.length - 1 ? 0.45 : 0.22;

      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.28, startTime + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.02);
    });
  } catch (e) {
    console.warn('Audio feedback not available', e);
  }
}

/**
 * Play an error/warning buzzer (e.g. Anti-Proxy Division Violation or Expired QR)
 */
export function playWarningBuzzer() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.setValueAtTime(130, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  } catch (e) {
    console.warn('Audio feedback not available', e);
  }
}

/**
 * Play Pomodoro timer end bell
 */
export function playTimerFinishBell() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      const startTime = now + idx * 0.1;
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 1.3);
    });
  } catch (e) {
    console.warn('Audio feedback not available', e);
  }
}

/**
 * Play or stop synthesized ambient background sound
 */
export function setAmbientSound(type: 'none' | 'binaural' | 'rain' | 'whitenoise', volume = 0.12) {
  try {
    const ctx = getAudioContext();

    // Stop current ambient
    if (currentAmbientNodes) {
      if (currentAmbientNodes.oscLeft) currentAmbientNodes.oscLeft.stop();
      if (currentAmbientNodes.oscRight) currentAmbientNodes.oscRight.stop();
      if (currentAmbientNodes.noiseNode) (currentAmbientNodes.noiseNode as AudioBufferSourceNode).stop();
      currentAmbientNodes = null;
    }

    if (type === 'none') {
      return;
    }

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume, ctx.currentTime);
    masterGain.connect(ctx.destination);

    if (type === 'binaural') {
      // 200 Hz carrier left, 214 Hz right (14 Hz sensory motor rhythm / beta focus)
      const oscLeft = ctx.createOscillator();
      const oscRight = ctx.createOscillator();
      const merger = ctx.createChannelMerger(2);

      oscLeft.type = 'sine';
      oscLeft.frequency.value = 210;

      oscRight.type = 'sine';
      oscRight.frequency.value = 224; // 14Hz difference

      const gainLeft = ctx.createGain();
      const gainRight = ctx.createGain();
      gainLeft.gain.value = 0.5;
      gainRight.gain.value = 0.5;

      oscLeft.connect(gainLeft);
      gainLeft.connect(merger, 0, 0); // left ear

      oscRight.connect(gainRight);
      gainRight.connect(merger, 0, 1); // right ear

      merger.connect(masterGain);

      oscLeft.start();
      oscRight.start();

      currentAmbientNodes = {
        oscLeft,
        oscRight,
        gainNode: masterGain,
      };
    } else if (type === 'rain' || type === 'whitenoise') {
      // Synthesized noise buffer
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'rain') {
          // Pink/Brown noise approximation for gentle rain
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5;
        } else {
          output[i] = white * 0.15;
        }
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = type === 'rain' ? 'lowpass' : 'bandpass';
      filter.frequency.value = type === 'rain' ? 800 : 1200;

      whiteNoise.connect(filter);
      filter.connect(masterGain);

      whiteNoise.start();

      currentAmbientNodes = {
        noiseNode: whiteNoise,
        filterNode: filter,
        gainNode: masterGain,
      };
    }
  } catch (e) {
    console.warn('Could not set ambient sound', e);
  }
}

/**
 * Play a futuristic Jarvis Iron Man-style wake sound
 */
export function playJarvisWakeSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Harmonic pulse 1 (Base resonance)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(440, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12);
    osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.25);

    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.25, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.45);

    // Harmonic pulse 2 (Subtle metallic shimmer)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now + 0.08);
    osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.28);

    gain2.gain.setValueAtTime(0.001, now + 0.08);
    gain2.gain.linearRampToValueAtTime(0.18, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.5);
  } catch (e) {
    console.warn('Jarvis wake sound error', e);
  }
}

/**
 * Play a high-tech Jarvis command acknowledgment chirp
 */
export function playJarvisActionSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.07); // E6

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  } catch (e) {
    console.warn('Jarvis action sound error', e);
  }
}

export type JarvisPersonality = 'professional' | 'casual' | 'witty';

export type JarvisVoiceId =
  | 'british_male'
  | 'stark_deep_male'
  | 'american_male'
  | 'indian_male'
  | 'hindi_male'
  | 'classic_butler'
  | 'tech_lead_male'
  | 'hindi_female'
  | 'classic_british'
  | 'friday_femme'
  | 'cyber_tony'
  | 'indian_academic'
  | 'quantum_robot'
  | 'device_custom';

export interface JarvisVoiceOption {
  id: string;
  name: string;
  badge: string;
  tagline: string;
  langMatch: string[];
  pitch: number;
  rate: number;
  preferGender?: 'male' | 'female';
}

export interface VoiceLanguageOption {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const JARVIS_LANGUAGES: VoiceLanguageOption[] = [
  { id: 'en-GB', code: 'en-GB', name: 'English (UK)', nativeName: 'British English', flag: '🇬🇧' },
  { id: 'en-US', code: 'en-US', name: 'English (US)', nativeName: 'American English', flag: '🇺🇸' },
  { id: 'en-IN', code: 'en-IN', name: 'English (India)', nativeName: 'Indian English', flag: '🇮🇳' },
  { id: 'hinglish', code: 'hinglish', name: 'Hinglish', nativeName: 'WhatsApp Style (Hindi + Eng)', flag: '💬' },
  { id: 'hi-IN', code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { id: 'mr-IN', code: 'mr-IN', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
];

export function getSpeechLangCode(language?: string): string {
  if (!language) return 'en-GB';
  if (language === 'hinglish') return 'en-IN';
  return language;
}

export const JARVIS_VOICES: JarvisVoiceOption[] = [
  {
    id: 'british_male',
    name: 'British Male (Iron Man J.A.R.V.I.S.)',
    badge: 'Cinematic AI 👨',
    tagline: 'Deep, calm, confident British male baritone (Iron Man Jarvis style)',
    langMatch: ['en-GB', 'en_GB', 'en-UK', 'en'],
    pitch: 0.82,
    rate: 1.0,
    preferGender: 'male',
  },
  {
    id: 'stark_deep_male',
    name: 'Stark Baritone Male (Ultra-Deep AI)',
    badge: 'Deep Resonance 👨',
    tagline: 'Deep authoritative baritone male resonance with Stark Industries presence',
    langMatch: ['en-GB', 'en-US', 'en'],
    pitch: 0.74,
    rate: 0.98,
    preferGender: 'male',
  },
  {
    id: 'american_male',
    name: 'American Male (Command Console)',
    badge: 'Tech Titan 👨',
    tagline: 'Authoritative, direct American male tone with studio vocal clarity',
    langMatch: ['en-US', 'en'],
    pitch: 0.88,
    rate: 1.02,
    preferGender: 'male',
  },
  {
    id: 'indian_male',
    name: 'Indian English Male (Campus Mentor)',
    badge: 'Academic Co-Pilot 👨',
    tagline: 'Articulate Indian English male accent ideal for engineering labs & study',
    langMatch: ['en-IN', 'hi-IN', 'en-GB', 'en'],
    pitch: 0.90,
    rate: 1.0,
    preferGender: 'male',
  },
  {
    id: 'hindi_male',
    name: 'Hindi Male Assistant (हिन्दी पुरुष)',
    badge: 'Native Hindi 👨',
    tagline: 'Natural conversational Hindi male voice with calm, respectful demeanor',
    langMatch: ['hi-IN', 'hi', 'en-IN'],
    pitch: 0.86,
    rate: 1.0,
    preferGender: 'male',
  },
  {
    id: 'classic_butler',
    name: 'British Butler Male (Alfred Protocol)',
    badge: 'Gentleman AI 👨',
    tagline: 'Refined, courteous British gentleman male assistant for focused study',
    langMatch: ['en-GB', 'en_GB', 'en'],
    pitch: 0.84,
    rate: 0.96,
    preferGender: 'male',
  },
  {
    id: 'tech_lead_male',
    name: 'Silicon Valley Male (Tech Lead)',
    badge: 'Engineering Lead 👨',
    tagline: 'Energetic, modern American engineering lead male voice',
    langMatch: ['en-US', 'en'],
    pitch: 0.92,
    rate: 1.06,
    preferGender: 'male',
  },
  {
    id: 'hindi_female',
    name: 'Hindi Female (हिन्दी महिला)',
    badge: 'Modern Assistant 👩',
    tagline: 'Crisp, articulate female voice in Hindi / Indian English',
    langMatch: ['hi-IN', 'hi', 'en-IN'],
    pitch: 1.12,
    rate: 1.04,
    preferGender: 'female',
  },
  {
    id: 'friday_femme',
    name: 'F.R.I.D.A.Y. Cyber Assistant',
    badge: 'Female AI 👩',
    tagline: 'High-tech female assistant persona',
    langMatch: ['en-IE', 'en-GB', 'en-US', 'en'],
    pitch: 1.15,
    rate: 1.05,
    preferGender: 'female',
  },
  {
    id: 'quantum_robot',
    name: 'Quantum Arc Synth',
    badge: 'Futuristic Mecha 🤖',
    tagline: 'Synthetic futuristic robotic frequencies',
    langMatch: ['en-US', 'en'],
    pitch: 1.30,
    rate: 0.95,
  },
];

export interface VoiceSettings {
  personality: JarvisPersonality;
  language: string; // 'en-GB' | 'en-US' | 'en-IN' | 'hinglish' | 'hi-IN' | 'mr-IN'
  voiceId: string;
  deviceVoiceURI?: string;
  rate: number; // 0.75 to 1.5
  pitch: number; // 0.7 to 1.3
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  personality: 'professional',
  language: 'en-GB',
  voiceId: 'british_male',
  deviceVoiceURI: '',
  rate: 1.0,
  pitch: 0.82, // Deep baritone pitch for cinematic Iron Man Jarvis male feel
};

/**
 * Get localized contextual greeting, deactivation, and fallback phrases
 */
export function getJarvisPhrases(
  language: string,
  personality: JarvisPersonality,
  userName: string = ''
) {
  const firstName = userName.split(' ')[0] || '';
  const isHinglish = language === 'hinglish';
  const isHindi = language === 'hi-IN';
  const isMarathi = language === 'mr-IN';

  let greeting = 'Yes, how can I help you?';
  let deactivated = 'Jarvis deactivated.';
  let notUnderstood = 'Sorry, I did not understand that command.';

  if (isHinglish) {
    if (personality === 'professional') {
      greeting = firstName ? `Haan ${firstName}, bataiye main aapki kya help kar sakta hoon?` : 'Haan sir, bataiye main aapki kya help kar sakta hoon?';
    } else if (personality === 'casual') {
      greeting = firstName ? `Hey ${firstName}! Kya haal hai, batao aaj kya kaam hai?` : 'Haan bro, batao kya help chahiye?';
    } else {
      greeting = firstName
        ? `Haan ${firstName}, hukum kijiye! Aaj kaunsa mission complete karna hai?`
        : 'Yes boss, bataiye kya kaam hai?';
    }
    deactivated = 'Jarvis standby mode me chala gaya hai.';
    notUnderstood = 'Sorry yaar, ye command samajh nahi aayi. Dobara bolo ya type karo!';
  } else if (isHindi) {
    if (personality === 'professional') {
      greeting = 'हाँ, मैं आपकी क्या मदद कर सकता हूँ?';
    } else if (personality === 'casual') {
      greeting = 'हाँ जी, बताइए क्या सहायता करूँ?';
    } else {
      greeting = 'हुक्म कीजिए, क्या सहायता चाहिए?';
    }
    deactivated = 'Jarvis deactivate ho gaya hai.';
    notUnderstood = 'माफ़ कीजिए, मुझे यह कमांड समझ नहीं आई।';
  } else if (isMarathi) {
    if (personality === 'professional') {
      greeting = 'हो, मी तुम्हाला कशी मदत करू शकतो?';
    } else if (personality === 'casual') {
      greeting = 'हो सांगा, काय मदत हवी आहे?';
    } else {
      greeting = 'सांगा, आज काय विशेष करायचे आहे?';
    }
    deactivated = 'Jarvis band jhale.';
    notUnderstood = 'क्षमस्व, मला ही कमांड समजली नाही.';
  } else {
    // English variations
    if (personality === 'professional') {
      greeting = 'Yes sir, how can I help you?';
    } else if (personality === 'casual') {
      greeting = firstName ? `Hey ${firstName}! How can I help you today?` : 'Yes sir, what can I do for you?';
    } else {
      greeting = firstName
        ? `Yes ${firstName}, how can I help you? All systems are primed.`
        : 'Yes sir, at your service. How can I help you?';
    }
    deactivated = 'Jarvis deactivated.';
    notUnderstood = 'Sorry, I did not understand that command.';
  }

  return { greeting, deactivated, notUnderstood };
}

let activeUtterance: SpeechSynthesisUtterance | null = null;

/**
 * Text-to-Speech speaking using Web Speech API with customizable Jarvis vocal personas
 */
export function speakJarvisMessage(
  text: string,
  callbacks?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
    rate?: number;
    pitch?: number;
    voiceId?: string;
    deviceVoiceURI?: string;
    language?: string;
  }
): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis is not supported in this environment');
    callbacks?.onError?.('SpeechSynthesis not supported');
    return false;
  }

  try {
    window.speechSynthesis.cancel();

    // Clean text of markdown asterisks, hashes, backticks for clean speech
    const cleanText = text
      .replace(/[*#`_~]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();

    if (!cleanText) return false;

    const selectedPersona =
      JARVIS_VOICES.find((v) => v.id === callbacks?.voiceId) || JARVIS_VOICES[0];

    const resolvedSpeechLang = getSpeechLangCode(callbacks?.language);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = callbacks?.rate ?? selectedPersona.rate;
    utterance.pitch = callbacks?.pitch ?? selectedPersona.pitch;
    if (callbacks?.language) {
      utterance.lang = resolvedSpeechLang;
    }

    // Keywords indicating male voices across all OS platforms (Windows, macOS, Linux, ChromeOS, Android)
    const MALE_VOICE_KEYWORDS = [
      'male', 'david', 'george', 'daniel', 'oliver', 'ryan', 'guy', 'alex', 'fred',
      'tom', 'rishi', 'hemant', 'madhur', 'prabhat', 'arthur', 'gordon', 'lee',
      'aaron', 'james', 'brian', 'paul', 'john', 'charles', 'mark', 'richard',
      'michael', 'steven', 'neil', 'alan', 'ian', 'eric', 'simon', 'stefan',
      'jarvis', 'andrew', 'william', 'stephen', 'thomas', 'edward', 'christopher',
      'anthony', 'jason', 'matthew', 'joseph', 'kevin', 'justin', 'en-gb-wls',
      'microsoft ryan', 'microsoft guy', 'microsoft george', 'microsoft david',
      'microsoft mark', 'microsoft james', 'google uk english male'
    ];

    const FEMALE_VOICE_KEYWORDS = [
      'female', 'zira', 'hazel', 'susan', 'samantha', 'victoria', 'karen', 'serena',
      'fiona', 'kate', 'tessa', 'stephanie', 'joanna', 'cynthia', 'allison', 'ava',
      'zoe', 'zuri', 'swara', 'aditi', 'ananya', 'kavya', 'priya', 'veena', 'lekha',
      'kalpana', 'geeta', 'sunita', 'ayumi', 'haruka', 'yuna', 'xiaoxiao', 'yaoyao',
      'microsoft zira', 'microsoft hazel', 'microsoft susan', 'microsoft aria', 'microsoft jenny'
    ];

    const isExplicitMale = (v: SpeechSynthesisVoice) => {
      const txt = `${v.name} ${v.voiceURI}`.toLowerCase();
      if (FEMALE_VOICE_KEYWORDS.some((kw) => txt.includes(kw))) return false;
      return MALE_VOICE_KEYWORDS.some((kw) => txt.includes(kw));
    };

    const isNotFemale = (v: SpeechSynthesisVoice) => {
      const txt = `${v.name} ${v.voiceURI}`.toLowerCase();
      return !FEMALE_VOICE_KEYWORDS.some((kw) => txt.includes(kw));
    };

    // Pick best matching voice from browser speech synthesis
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      let matchedVoice: SpeechSynthesisVoice | undefined;

      // 1. If explicit deviceVoiceURI was chosen
      if (callbacks?.deviceVoiceURI) {
        matchedVoice = voices.find((v) => v.voiceURI === callbacks.deviceVoiceURI);
      }

      // 2. Target specific persona if not matched by URI
      if (!matchedVoice) {
        const targetLang = getSpeechLangCode(callbacks?.language).toLowerCase();
        const isMalePersona = selectedPersona.preferGender === 'male';

        if (isMalePersona) {
          // Specific persona heuristics for male voices:
          if (selectedPersona.id === 'british_male' || selectedPersona.id === 'classic_butler' || selectedPersona.id === 'stark_deep_male') {
            matchedVoice =
              voices.find((v) => (v.lang.startsWith('en-GB') || v.lang.startsWith('en_GB')) && isExplicitMale(v)) ||
              voices.find((v) => (v.lang.startsWith('en-GB') || v.lang.startsWith('en_GB')) && isNotFemale(v)) ||
              voices.find((v) => v.lang.startsWith('en') && isExplicitMale(v));
          } else if (selectedPersona.id === 'american_male' || selectedPersona.id === 'tech_lead_male') {
            matchedVoice =
              voices.find((v) => v.lang.startsWith('en-US') && isExplicitMale(v)) ||
              voices.find((v) => v.lang.startsWith('en-US') && isNotFemale(v)) ||
              voices.find((v) => v.lang.startsWith('en') && isExplicitMale(v));
          } else if (selectedPersona.id === 'indian_male') {
            matchedVoice =
              voices.find((v) => v.lang.startsWith('en-IN') && isExplicitMale(v)) ||
              voices.find((v) => v.lang.startsWith('en-IN') && isNotFemale(v)) ||
              voices.find((v) => v.lang.startsWith('en') && isExplicitMale(v));
          } else if (selectedPersona.id === 'hindi_male') {
            matchedVoice =
              voices.find((v) => v.lang.startsWith('hi') && isExplicitMale(v)) ||
              voices.find((v) => v.lang.startsWith('hi') && isNotFemale(v)) ||
              voices.find((v) => v.lang.startsWith('en-IN') && isExplicitMale(v));
          }

          // General male fallback: find ANY male voice in target language or English
          if (!matchedVoice) {
            matchedVoice =
              voices.find((v) => v.lang.toLowerCase().startsWith(targetLang.slice(0, 2)) && isExplicitMale(v)) ||
              voices.find((v) => isExplicitMale(v)) ||
              voices.find((v) => v.lang.toLowerCase().startsWith(targetLang.slice(0, 2)) && isNotFemale(v)) ||
              voices.find((v) => isNotFemale(v));
          }

          // If device ONLY has female voices installed, adjust pitch to deep baritone male register
          if (!matchedVoice || !isExplicitMale(matchedVoice)) {
            utterance.pitch = Math.min(utterance.pitch, 0.76);
          }
        } else if (selectedPersona.preferGender === 'female') {
          matchedVoice =
            voices.find((v) => v.lang.toLowerCase().startsWith(targetLang.slice(0, 2)) && !isExplicitMale(v)) ||
            voices.find((v) => !isExplicitMale(v));
        }

        // Final fallback
        if (!matchedVoice && targetLang) {
          matchedVoice =
            voices.find((v) => v.lang.replace('_', '-').toLowerCase().startsWith(targetLang.slice(0, 2))) ||
            voices.find((v) => v.lang.startsWith('en'));
        }
      }

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
    }

    utterance.onstart = () => {
      callbacks?.onStart?.();
    };

    utterance.onend = () => {
      activeUtterance = null;
      callbacks?.onEnd?.();
    };

    utterance.onerror = (e) => {
      activeUtterance = null;
      callbacks?.onError?.(e);
      callbacks?.onEnd?.();
    };

    activeUtterance = utterance;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.warn('Speech synthesis error:', err);
    callbacks?.onError?.(err);
    return false;
  }
}

/**
 * Instantly cancel active speech synthesis
 */
export function stopJarvisSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      activeUtterance = null;
    } catch (e) {
      console.warn('Error stopping speech', e);
    }
  }
}

