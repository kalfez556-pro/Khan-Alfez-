import React, { useState, useEffect } from 'react';
import {
  VoiceSettings,
  JarvisPersonality,
  JARVIS_VOICES,
  JARVIS_LANGUAGES,
  DEFAULT_VOICE_SETTINGS,
  speakJarvisMessage,
  stopJarvisSpeech,
  getJarvisPhrases,
  playJarvisActionSound
} from '../../utils/audio';
import {
  Sliders,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Bot,
  Zap,
  RotateCcw,
  Check,
  PlayCircle,
  Activity,
  Globe,
  Radio,
  UserCheck,
  Flame,
  Award
} from 'lucide-react';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: VoiceSettings;
  onSaveSettings: (newSettings: VoiceSettings) => void;
  userName?: string;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  userName = 'Rahul'
}) => {
  const [localSettings, setLocalSettings] = useState<VoiceSettings>(settings);
  const [isTesting, setIsTesting] = useState(false);
  const [deviceVoices, setDeviceVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('male');

  // Keep local copy in sync when opened
  useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
    }
  }, [isOpen, settings]);

  // Load available browser device voices
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const allVoices = window.speechSynthesis.getVoices();
        const seen = new Set<string>();
        const uniqueVoices: SpeechSynthesisVoice[] = [];
        for (const voice of allVoices) {
          const id = `${voice.voiceURI || voice.name}__${voice.lang}`;
          if (!seen.has(id)) {
            seen.add(id);
            uniqueVoices.push(voice);
          }
        }
        setDeviceVoices(uniqueVoices);
      }
    };
    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  const handleTestVoice = () => {
    stopJarvisSpeech();
    setIsTesting(true);
    playJarvisActionSound();

    const phrases = getJarvisPhrases(localSettings.language, localSettings.personality, userName);

    let testPhrase = phrases.greeting;
    if (localSettings.language === 'hinglish') {
      testPhrase = localSettings.personality === 'witty'
        ? 'Haan bhai, Jarvis ready hai! Batao aaj kaunsa assignment ya quiz crack karna hai?'
        : localSettings.personality === 'casual'
        ? `Hey ${userName.split(' ')[0]}! Sab set hai, batao aaj kya help chahiye?`
        : `Haan ${userName.split(' ')[0]}, Jarvis online hai. Bataiye aapki kya help kar sakta hoon?`;
    } else if (localSettings.language === 'hi-IN') {
      testPhrase = localSettings.personality === 'witty'
        ? 'हुक्म कीजिए, क्या सहायता चाहिए? जार्विस तैयार है।'
        : 'नमस्ते! मैं जार्विस हूँ। बताइए मैं आपकी क्या सहायता करूँ?';
    } else if (localSettings.language === 'mr-IN') {
      testPhrase = 'नमस्कार! मी जार्विस आहे. सांगा आज आपण काय अभ्यास करणार आहोत?';
    } else {
      testPhrase = localSettings.personality === 'witty'
        ? `Yes ${userName.split(' ')[0]}, how can I help you? Or are we saving the semester again?`
        : localSettings.personality === 'casual'
        ? `Hey ${userName.split(' ')[0]}! What can I do for you today? Ready when you are.`
        : `Yes ${userName.split(' ')[0]}, how can I help you? All systems are fully operational.`;
    }

    speakJarvisMessage(testPhrase, {
      voiceId: localSettings.voiceId,
      deviceVoiceURI: localSettings.deviceVoiceURI,
      language: localSettings.language,
      rate: localSettings.rate,
      pitch: localSettings.pitch,
      onStart: () => setIsTesting(true),
      onEnd: () => setIsTesting(false),
      onError: () => setIsTesting(false)
    });
  };

  const handleResetDefaults = () => {
    setLocalSettings(DEFAULT_VOICE_SETTINGS);
  };

  const handleSave = () => {
    stopJarvisSpeech();
    onSaveSettings(localSettings);
    onClose();
  };

  const speedPresets = [
    { label: '0.85x Cinematic', value: 0.85 },
    { label: '1.0x Normal', value: 1.0 },
    { label: '1.15x Fast', value: 1.15 },
    { label: '1.30x Turbo', value: 1.3 }
  ];

  const pitchPresets = [
    { label: '0.84x Deep Jarvis', value: 0.84 },
    { label: '1.0x Balanced', value: 1.0 },
    { label: '1.15x Bright', value: 1.15 }
  ];

  const personalities: { id: JarvisPersonality; title: string; badge: string; desc: string; sample: string }[] = [
    {
      id: 'professional',
      title: 'Professional Protocol',
      badge: 'Calm & Confident',
      desc: 'Calm, authoritative, respectful tone. Standard Stark Industries protocol.',
      sample: '"Yes, how can I help you? All workstations are standing by."'
    },
    {
      id: 'casual',
      title: 'Casual Peer',
      badge: 'Friendly & Warm',
      desc: 'Friendly, warm, and approachable academic co-pilot for late night study.',
      sample: '"Hey! What can I do for you today? Let\'s get right to it."'
    },
    {
      id: 'witty',
      title: 'Witty Iron Man Banter',
      badge: 'Sarcastic & Sharp',
      desc: 'Clever, sarcastic Tony Stark style banter with dry humor and quick intelligence.',
      sample: '"At your service, sir. How can I help you, or are we saving the semester again?"'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top clean accent bar */}
        <div className="h-1.5 w-full bg-blue-600" />

        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Jarvis Voice & Audio Settings</h3>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-bold">
                  Audio Core
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Customize AI personality, language, playback speed, and vocal frequency
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopJarvisSpeech();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Settings Form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* SECTION 1: PERSONALITY SELECTOR */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold uppercase text-slate-800 flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-blue-600" />
                <span>1. Jarvis Personality Persona</span>
              </label>
              <span className="text-[11px] font-mono text-slate-500">
                Selected: <strong className="text-blue-600 uppercase">{localSettings.personality}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {personalities.map((p) => {
                const isSelected = localSettings.personality === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setLocalSettings((prev) => ({ ...prev, personality: p.id }))}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-600 ring-1 ring-blue-600 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                          {p.title}
                        </h4>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {p.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
                        {p.desc}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200 text-[10px] italic text-slate-500 line-clamp-2">
                      {p.sample}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: LANGUAGE SELECTION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold uppercase text-slate-800 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-blue-600" />
                <span>2. Speech Recognition & Output Language</span>
              </label>
              <span className="text-[11px] font-mono text-slate-500">
                Microphone updates automatically
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {JARVIS_LANGUAGES.map((lang) => {
                const isSelected = localSettings.language === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => setLocalSettings((prev) => ({ ...prev, language: lang.code }))}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm">{lang.flag}</span>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-xs font-semibold mt-1 truncate">{lang.name}</span>
                    <span className={`text-[10px] font-mono ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                      {lang.nativeName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: VOICE PRESET SELECTION (PROMINENT MALE ASSISTANT OPTIONS) */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-mono font-bold uppercase text-slate-800 flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-blue-600" />
                <span>3. Jarvis AI Voice Persona</span>
              </label>

              {/* Gender Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setGenderFilter('male')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                    genderFilter === 'male'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>👨 Male Voices ({JARVIS_VOICES.filter((v) => v.preferGender === 'male').length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGenderFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                    genderFilter === 'all'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>All ({JARVIS_VOICES.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGenderFilter('female')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                    genderFilter === 'female'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>👩 Female ({JARVIS_VOICES.filter((v) => v.preferGender === 'female').length})</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {JARVIS_VOICES.filter((v) =>
                genderFilter === 'all'
                  ? true
                  : genderFilter === 'male'
                  ? v.preferGender === 'male'
                  : v.preferGender === 'female'
              ).map((v) => {
                const isSelected = localSettings.voiceId === v.id && !localSettings.deviceVoiceURI;
                return (
                  <div
                    key={v.id}
                    onClick={() => setLocalSettings((prev) => ({ ...prev, voiceId: v.id, deviceVoiceURI: '' }))}
                    className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-600 shadow-xs ring-1 ring-blue-600'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-bold text-slate-900">{v.name}</h5>
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold border ${
                          v.preferGender === 'male'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {v.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{v.tagline}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />}
                  </div>
                );
              })}
            </div>

            {/* Custom Device Voice Selector */}
            {deviceVoices.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <label className="text-[11px] font-mono text-slate-600 block">
                  Or select custom operating system device voice:
                </label>
                <select
                  value={localSettings.deviceVoiceURI || ''}
                  onChange={(e) => setLocalSettings((prev) => ({ ...prev, deviceVoiceURI: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="">Use Curated Jarvis Persona Above (Recommended)</option>
                  {deviceVoices.map((dv, idx) => (
                    <option key={`sys-voice-${dv.voiceURI || dv.name}-${dv.lang}-${idx}`} value={dv.voiceURI}>
                      {dv.name} ({dv.lang}) {dv.default ? '— System Default' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* SECTION 4: PLAYBACK SPEED & PITCH ADJUSTMENT SLIDERS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            {/* Playback Speed (Rate) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-slate-800">Playback Speed (Rate)</span>
                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {localSettings.rate.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min="0.75"
                max="1.50"
                step="0.05"
                value={localSettings.rate}
                onChange={(e) => setLocalSettings((prev) => ({ ...prev, rate: parseFloat(e.target.value) }))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {speedPresets.map((sp) => (
                  <button
                    key={sp.value}
                    onClick={() => setLocalSettings((prev) => ({ ...prev, rate: sp.value }))}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border transition cursor-pointer ${
                      Math.abs(localSettings.rate - sp.value) < 0.02
                        ? 'bg-blue-600 text-white border-blue-600 font-bold'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {sp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pitch (Lower for Cinematic Jarvis) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-slate-800">Pitch (Vocal Depth)</span>
                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {localSettings.pitch.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min="0.70"
                max="1.30"
                step="0.02"
                value={localSettings.pitch}
                onChange={(e) => setLocalSettings((prev) => ({ ...prev, pitch: parseFloat(e.target.value) }))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {pitchPresets.map((pp) => (
                  <button
                    key={pp.value}
                    onClick={() => setLocalSettings((prev) => ({ ...prev, pitch: pp.value }))}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border transition cursor-pointer ${
                      Math.abs(localSettings.pitch - pp.value) < 0.02
                        ? 'bg-blue-600 text-white border-blue-600 font-bold'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {pp.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Test Voice Button */}
            <button
              onClick={handleTestVoice}
              disabled={isTesting}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold font-mono flex items-center gap-2 transition shadow-xs cursor-pointer"
            >
              {isTesting ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>Speaking Sample...</span>
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4" />
                  <span>Test Voice Sample</span>
                </>
              )}
            </button>

            <button
              onClick={handleResetDefaults}
              className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-mono transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs font-mono shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Voice Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
