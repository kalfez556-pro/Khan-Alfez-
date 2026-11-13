import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserProfile, Assignment, StudyNote } from '../../types';
import {
  playJarvisWakeSound,
  playJarvisActionSound,
  speakJarvisMessage,
  stopJarvisSpeech,
  JARVIS_VOICES,
  JARVIS_LANGUAGES,
  DEFAULT_VOICE_SETTINGS,
  VoiceSettings,
  getJarvisPhrases,
  getSpeechLangCode
} from '../../utils/audio';
import { VoiceSettingsModal } from './VoiceSettingsModal';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Bot,
  X,
  Zap,
  Activity,
  Terminal,
  CheckCircle2,
  Clock,
  Radio,
  Sliders,
  Send,
  Globe,
  RotateCcw,
  HelpCircle,
  Play,
  Square,
  QrCode,
  BookOpen,
  Award,
  Gem,
  User
} from 'lucide-react';

interface VoiceMessage {
  id: string;
  sender: 'user' | 'jarvis';
  text: string;
  timestamp: string;
  actionTaken?: string;
  isDeactivationNotice?: boolean;
}

interface JarvisVoiceAssistantProps {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  assignments: Assignment[];
  notes: StudyNote[];
  activeTab: string;
  onNavigateTab: (tabId: string) => void;
  onOpenProfileModal?: () => void;
  voiceSettings?: VoiceSettings;
  onSaveVoiceSettings?: (newSettings: VoiceSettings) => void;
  wakeWordEnabled?: boolean;
  onToggleWakeWord?: (enabled: boolean) => void;
  micEnabled?: boolean;
  onToggleMic?: (enabled: boolean) => void;
  onOpenSettings?: () => void;
}

interface SpeechRecognitionEventLike {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal?: boolean;
    };
    length: number;
  };
}

export const JarvisVoiceAssistant: React.FC<JarvisVoiceAssistantProps> = ({
  currentUser,
  allUsers,
  assignments,
  notes,
  activeTab,
  onNavigateTab,
  onOpenProfileModal,
  voiceSettings: propVoiceSettings,
  onSaveVoiceSettings: propOnSaveVoiceSettings,
  wakeWordEnabled: propWakeWordEnabled = true,
  onToggleWakeWord: propOnToggleWakeWord,
  micEnabled: propMicEnabled = true,
  onToggleMic: propOnToggleMic,
  onOpenSettings
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false);
  const [isMicListening, setIsMicListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(propWakeWordEnabled);
  const [micEnabled, setMicEnabled] = useState(propMicEnabled);
  const [soundMuted, setSoundMuted] = useState(false);

  // Sync with prop updates
  useEffect(() => {
    setWakeWordEnabled(propWakeWordEnabled);
  }, [propWakeWordEnabled]);

  useEffect(() => {
    setMicEnabled(propMicEnabled);
  }, [propMicEnabled]);

  // Typed Command Input State
  const [typedCommand, setTypedCommand] = useState('');

  // Voice Settings (Personality, Language, Voice ID, Speed Rate, Pitch)
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
    if (propVoiceSettings) return propVoiceSettings;
    try {
      const saved = localStorage.getItem('studysmart_voice_settings');
      return saved ? JSON.parse(saved) : DEFAULT_VOICE_SETTINGS;
    } catch {
      return DEFAULT_VOICE_SETTINGS;
    }
  });

  useEffect(() => {
    if (propVoiceSettings) {
      setVoiceSettings(propVoiceSettings);
    }
  }, [propVoiceSettings]);

  // Assistant Status: 'off' | 'listening_wake' | 'active_greeting' | 'waiting_command' | 'deactivated_timeout' | 'executing'
  const [assistantState, setAssistantState] = useState<
    'off' | 'listening_wake' | 'active_greeting' | 'waiting_command' | 'deactivated_timeout' | 'executing'
  >('listening_wake');

  const [countdownSeconds, setCountdownSeconds] = useState<number>(3);
  const [statusMessage, setStatusMessage] = useState<string>(
    propMicEnabled ? 'Listening for "Hey Jarvis"...' : 'Mic muted in Settings. Say "Hey Jarvis" once enabled.'
  );
  const [transcript, setTranscript] = useState<string>('');

  // Floating Action Banner (Hey Google style hands-free top pill)
  const [actionBanner, setActionBanner] = useState<{
    title: string;
    actionText: string;
    icon?: string;
  } | null>(null);
  const actionBannerTimerRef = useRef<any>(null);

  const triggerActionBanner = useCallback((title: string, actionText: string, icon = 'zap') => {
    if (actionBannerTimerRef.current) {
      clearTimeout(actionBannerTimerRef.current);
    }
    setActionBanner({ title, actionText, icon });
    actionBannerTimerRef.current = setTimeout(() => {
      setActionBanner(null);
    }, 4500);
  }, []);

  const [messages, setMessages] = useState<VoiceMessage[]>([
    {
      id: 'init-1',
      sender: 'jarvis',
      text: `Jarvis AI initialized. Say "Hey Jarvis" or tap Start Jarvis to activate. If no command is received within 3 seconds, I will automatically deactivate.`,
      timestamp: 'Online'
    }
  ]);
  const [micSupported, setMicSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const isAwaitingCommandRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const countdownIntervalRef = useRef<any>(null);
  const timeoutIdRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const firstName = currentUser.name.split(' ')[0];

  // Save voice settings to localStorage & notify parent
  const handleSaveSettings = (newSettings: VoiceSettings) => {
    setVoiceSettings(newSettings);
    localStorage.setItem('studysmart_voice_settings', JSON.stringify(newSettings));
    propOnSaveVoiceSettings?.(newSettings);
  };

  // Scroll message container to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Keep ref synchronized
  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  /**
   * Helper to speak responses using active VoiceSettings
   */
  const speakResponse = useCallback(
    (text: string, onDone?: () => void) => {
      if (soundMuted) {
        onDone?.();
        return;
      }

      setIsSpeaking(true);

      speakJarvisMessage(text, {
        voiceId: voiceSettings.voiceId,
        deviceVoiceURI: voiceSettings.deviceVoiceURI,
        language: voiceSettings.language,
        rate: voiceSettings.rate,
        pitch: voiceSettings.pitch,
        onStart: () => {
          setIsSpeaking(true);
        },
        onEnd: () => {
          setIsSpeaking(false);
          onDone?.();
        },
        onError: () => {
          setIsSpeaking(false);
          onDone?.();
        }
      });
    },
    [soundMuted, voiceSettings]
  );

  /**
   * Clear 3-second countdown timer
   */
  const clearCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    setCountdownSeconds(3);
  }, []);

  /**
   * 3-Second Timeout Handler:
   * When user does not give a command within 3s after Jarvis greets:
   * Jarvis deactivates, announces "Jarvis deactivated.", and turns off!
   */
  const handleTimeoutDeactivation = useCallback(() => {
    clearCountdown();
    isAwaitingCommandRef.current = false;
    setAssistantState('deactivated_timeout');
    setStatusMessage('Jarvis deactivated due to no command.');

    const phrases = getJarvisPhrases(voiceSettings.language, voiceSettings.personality, firstName);
    const deactivationText = phrases.deactivated;

    setMessages((prev) => [
      ...prev,
      {
        id: `jarvis-deactivated-${Date.now()}`,
        sender: 'jarvis',
        text: deactivationText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isDeactivationNotice: true
      }
    ]);

    speakResponse(deactivationText, () => {
      // Return to silent standby listening strictly for "Hey Jarvis"
      setAssistantState('listening_wake');
      setStatusMessage('💤 Microphone Standby • Say "Hey Jarvis" to activate');
    });
  }, [clearCountdown, voiceSettings, firstName, speakResponse]);

  /**
   * Start the strict 3-second countdown timer for command input
   */
  const startCommandCountdown = useCallback(() => {
    clearCountdown();
    setAssistantState('waiting_command');
    isAwaitingCommandRef.current = true;
    setCountdownSeconds(3);
    setStatusMessage('🎙️ Microphone Active • Listening for your command: 3s');

    let secondsLeft = 3;
    countdownIntervalRef.current = setInterval(() => {
      secondsLeft -= 1;
      setCountdownSeconds(Math.max(0, secondsLeft));
      if (secondsLeft > 0) {
        setStatusMessage(`🎙️ Microphone Active • Listening for your command: ${secondsLeft}s`);
      }
    }, 1000);

    timeoutIdRef.current = setTimeout(() => {
      handleTimeoutDeactivation();
    }, 3000);
  }, [clearCountdown, handleTimeoutDeactivation]);

  /**
   * Process and execute user command (Voice or Typed)
   */
  const executeCommand = useCallback(
    async (commandText: string) => {
      clearCountdown();
      isAwaitingCommandRef.current = false;
      setAssistantState('executing');
      setStatusMessage('Processing command...');

      const trimmed = commandText.trim();
      if (!trimmed) return;

      // Add user message to conversation log
      const userMsg: VoiceMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: trimmed,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsThinking(true);

      const lower = trimmed.toLowerCase();
      const phrases = getJarvisPhrases(voiceSettings.language, voiceSettings.personality, firstName);

      // ==========================================
      // 1. "Open QR Code System" / "Scan Attendance" / "QR" (Hands-Free)
      // ==========================================
      const isQrCommand =
        lower === 'qr' ||
        lower.includes('qr') ||
        lower.includes('attendance') ||
        lower.includes('scan') ||
        lower.includes('hazri') ||
        lower.includes('barcode') ||
        lower.includes('proxy');

      if (isQrCommand) {
        playJarvisActionSound();
        onNavigateTab('attendance');
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent('jarvis-action-qr', {
              detail: {
                action: 'open',
                autoCamera: lower.includes('scan') || lower.includes('camera')
              }
            })
          );
        }, 120);

        // Hands-free: auto-dismiss overlay so user immediately sees the QR system!
        setIsOpen(false);

        const isHinglish = voiceSettings.language === 'hinglish';
        const isHindi = voiceSettings.language === 'hi-IN';
        const isMarathi = voiceSettings.language === 'mr-IN';
        const reply = isHinglish
          ? (lower.includes('scan') ? 'QR code scanner khol raha hoon.' : 'QR attendance system khol raha hoon.')
          : isHindi
          ? (lower.includes('scan') ? 'क्यूआर कोड स्कैनर खोल रहा हूँ।' : 'क्यूआर कोड अटेंडेंस सिस्टम खोल रहा हूँ।')
          : isMarathi
          ? 'क्यूआर कोड हजेरी प्रणाली सुरू करत आहे.'
          : (lower.includes('scan') ? 'Opening QR code scanner for attendance.' : 'Opening QR code attendance system.');

        triggerActionBanner('QR Code System', reply, 'qr');
        setMessages((prev) => [
          ...prev,
          {
            id: `jarvis-${Date.now()}`,
            sender: 'jarvis',
            text: reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actionTaken: 'Opened QR Code Attendance Station (Hands-free)'
          }
        ]);
        setIsThinking(false);
        speakResponse(reply, () => {
          setAssistantState('listening_wake');
          setStatusMessage('💤 Microphone Standby • Say "Hey Jarvis" to activate');
        });
        return;
      }

      // ==========================================
      // 2. "Open Study" or "Open Dashboard"
      // ==========================================
      if (
        lower === 'open study' ||
        lower.includes('open study') ||
        lower.includes('open study phantom') ||
        lower.includes('open studysmart') ||
        lower.includes('dashboard') ||
        lower.includes('home') ||
        lower === 'study'
      ) {
        playJarvisActionSound();
        onNavigateTab('hub');
        setIsOpen(false);
        const reply = voiceSettings.language === 'hinglish'
          ? 'Study Phantom dashboard khol raha hoon.'
          : 'Opening Study Phantom dashboard.';
        triggerActionBanner('Study Phantom Hub', reply, 'home');
        setMessages((prev) => [
          ...prev,
          {
            id: `jarvis-${Date.now()}`,
            sender: 'jarvis',
            text: reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actionTaken: 'Opened Study Phantom Hub'
          }
        ]);
        setIsThinking(false);
        speakResponse(reply, () => {
          setAssistantState('listening_wake');
          setStatusMessage('💤 Microphone Standby • Say "Hey Jarvis" to activate');
        });
        return;
      }

      // ==========================================
      // 3. "Create Flashcard"
      // ==========================================
      if (
        lower === 'create flashcard' ||
        lower.includes('create flashcard') ||
        lower.includes('flashcard') ||
        lower.includes('flashcards')
      ) {
        playJarvisActionSound();
        onNavigateTab('quizzes');
        setIsOpen(false);
        const reply = voiceSettings.language === 'hinglish'
          ? 'Flashcard creator khol raha hoon.'
          : 'Opening flashcard creator.';
        triggerActionBanner('Flashcard Creator', reply, 'sparkles');
        setMessages((prev) => [
          ...prev,
          {
            id: `jarvis-${Date.now()}`,
            sender: 'jarvis',
            text: reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actionTaken: 'Opened Flashcard & Quiz Station'
          }
        ]);
        setIsThinking(false);
        speakResponse(reply, () => {
          setAssistantState('listening_wake');
          setStatusMessage('💤 Microphone Standby • Say "Hey Jarvis" to activate');
        });
        return;
      }

      // ==========================================
      // 4. "Start Quiz"
      // ==========================================
      if (
        lower === 'start quiz' ||
        lower.includes('start quiz') ||
        lower.includes('open quiz') ||
        lower.includes('quiz arena') ||
        lower.includes('mega test') ||
        lower.includes('quiz')
      ) {
        playJarvisActionSound();
        onNavigateTab('quizzes');
        setIsOpen(false);
        const reply = voiceSettings.language === 'hinglish'
          ? 'Quiz Arena start kar raha hoon.'
          : 'Starting Quiz Arena.';
        triggerActionBanner('Quiz Arena', reply, 'trophy');
        setMessages((prev) => [
          ...prev,
          {
            id: `jarvis-${Date.now()}`,
            sender: 'jarvis',
            text: reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actionTaken: 'Launched Quiz Arena'
          }
        ]);
        setIsThinking(false);
        speakResponse(reply, () => {
          setAssistantState('listening_wake');
          setStatusMessage('💤 Microphone Standby • Say "Hey Jarvis" to activate');
        });
        return;
      }

      // ==========================================
      // 5. "Open Notes"
      // ==========================================
      if (
        lower === 'open notes' ||
        lower.includes('open notes') ||
        lower.includes('notes') ||
        lower.includes('pdf reader') ||
        lower.includes('padhai')
      ) {
        playJarvisActionSound();
        onNavigateTab('notes');
        setIsOpen(false);
        const reply = voiceSettings.language === 'hinglish'
          ? 'Study notes khol raha hoon.'
          : 'Opening study notes.';
        triggerActionBanner('Study Notes', reply, 'book');
        setMessages((prev) => [
          ...prev,
          {
            id: `jarvis-${Date.now()}`,
            sender: 'jarvis',
            text: reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actionTaken: 'Opened Study Notes Codex'
          }
        ]);
        setIsThinking(false);
        speakResponse(reply, () => {
          setAssistantState('listening_wake');
          setStatusMessage('💤 Microphone Standby • Say "Hey Jarvis" to activate');
        });
        return;
      }

      // ==========================================
      // 6. "Hello Jarvis"
      // ==========================================
      if (
        lower === 'hello jarvis' ||
        lower === 'hi jarvis' ||
        lower === 'hey jarvis' ||
        lower === 'hello'
      ) {
        playJarvisActionSound();
        const reply = phrases.greeting;
        setMessages((prev) => [
          ...prev,
          {
            id: `jarvis-${Date.now()}`,
            sender: 'jarvis',
            text: reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setIsThinking(false);
        speakResponse(reply, () => {
          startCommandCountdown();
        });
        return;
      }

      // ==========================================
      // 7. "Open Assignments" / "Check Deadlines"
      // ==========================================
      if (
        lower.includes('assignment') ||
        lower.includes('deadline') ||
        lower.includes('lab') ||
        lower.includes('submission') ||
        lower.includes('homework')
      ) {
        playJarvisActionSound();
        onNavigateTab('assignments');
        setIsOpen(false);
        const reply = voiceSettings.language === 'hinglish'
          ? 'Lab assignments khol raha hoon.'
          : 'Opening lab assignments.';
        triggerActionBanner('Assignments', reply, 'terminal');
        setMessages((prev) => [
          ...prev,
          {
            id: `jarvis-${Date.now()}`,
            sender: 'jarvis',
            text: reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actionTaken: 'Opened Lab Workstation'
          }
        ]);
        setIsThinking(false);
        speakResponse(reply, () => {
          setAssistantState('listening_wake');
          setStatusMessage('💤 Microphone Standby • Say "Hey Jarvis" to activate');
        });
        return;
      }

      // ==========================================
      // 8. "Start Pomodoro" / "Start Focus"
      // ==========================================
      if (
        lower.includes('pomodoro') ||
        lower.includes('focus') ||
        lower.includes('timer')
      ) {
        playJarvisActionSound();
        onNavigateTab('pomodoro');
        setIsOpen(false);
        const reply = voiceSettings.language === 'hinglish'
          ? 'Focus timer start kar raha hoon.'
          : 'Starting focus timer.';
        triggerActionBanner('Pomodoro Timer', reply, 'clock');
        setMessages((prev) => [
          ...prev,
          {
            id: `jarvis-${Date.now()}`,
            sender: 'jarvis',
            text: reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actionTaken: 'Launched Pomodoro Focus Station'
          }
        ]);
        setIsThinking(false);
        speakResponse(reply, () => {
          setAssistantState('listening_wake');
          setStatusMessage('💤 Microphone Standby • Say "Hey Jarvis" to activate');
        });
        return;
      }

      // ==========================================
      // 9. "Open Leaderboard" / "Ranks"
      // ==========================================
      if (
        lower.includes('leaderboard') ||
        lower.includes('rank') ||
        lower.includes('topper')
      ) {
        playJarvisActionSound();
        onNavigateTab('leaderboard');
        setIsOpen(false);
        const reply = voiceSettings.language === 'hinglish'
          ? 'Student leaderboard khol raha hoon.'
          : 'Opening student leaderboard.';
        triggerActionBanner('Leaderboard', reply, 'award');
        setMessages((prev) => [
          ...prev,
          {
            id: `jarvis-${Date.now()}`,
            sender: 'jarvis',
            text: reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actionTaken: 'Opened Student Leaderboard'
          }
        ]);
        setIsThinking(false);
        speakResponse(reply, () => {
          setAssistantState('listening_wake');
          setStatusMessage('💤 Microphone Standby • Say "Hey Jarvis" to activate');
        });
        return;
      }

      // ==========================================
      // 10. "Open Store" / "Rewards"
      // ==========================================
      if (
        lower.includes('store') ||
        lower.includes('reward') ||
        lower.includes('perk') ||
        lower.includes('gem')
      ) {
        playJarvisActionSound();
        onNavigateTab('store');
        setIsOpen(false);
        const reply = voiceSettings.language === 'hinglish'
          ? 'Rewards store khol raha hoon.'
          : 'Opening academic rewards store.';
        triggerActionBanner('Rewards Store', reply, 'gem');
        setMessages((prev) => [
          ...prev,
          {
            id: `jarvis-${Date.now()}`,
            sender: 'jarvis',
            text: reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actionTaken: 'Opened Rewards Store'
          }
        ]);
        setIsThinking(false);
        speakResponse(reply, () => {
          setAssistantState('listening_wake');
          setStatusMessage('💤 Microphone Standby • Say "Hey Jarvis" to activate');
        });
        return;
      }

      // ==========================================
      // 11. "Open Voice Settings"
      // ==========================================
      if (
        lower.includes('voice setting') ||
        lower.includes('change voice') ||
        lower.includes('audio setting')
      ) {
        playJarvisActionSound();
        setIsOpen(false);
        setIsVoiceSettingsOpen(true);
        const reply = voiceSettings.language === 'hinglish'
          ? 'Voice settings khol raha hoon.'
          : 'Opening voice settings.';
        triggerActionBanner('Voice Settings', reply, 'sliders');
        speakResponse(reply, () => {
          setAssistantState('listening_wake');
          setStatusMessage('💤 Microphone Standby • Say "Hey Jarvis" to activate');
        });
        return;
      }

      // ==========================================
      // 12. Stop / Deactivate
      // ==========================================
      if (
        lower === 'stop' ||
        lower === 'deactivate' ||
        lower === 'close' ||
        lower === 'exit' ||
        lower === 'silence' ||
        lower === 'band karo' ||
        lower === 'ruko' ||
        lower === 'bye jarvis'
      ) {
        stopJarvisSpeech();
        setIsSpeaking(false);
        setIsThinking(false);
        setIsOpen(false);
        setActionBanner(null);
        setAssistantState('listening_wake');
        setStatusMessage('Jarvis is off. Say "Hey Jarvis" to activate.');
        return;
      }

      // ==========================================
      // INTELLIGENT AI / NATURAL LANGUAGE QUERY
      // ==========================================
      try {
        const response = await fetch('/api/ai/voice-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: trimmed,
            userName: currentUser.name,
            userRole: currentUser.role,
            personality: voiceSettings.personality,
            language: voiceSettings.language,
            contextData: {
              division: currentUser.division,
              gems: currentUser.gems,
              streakDays: currentUser.streakDays,
              activeTab,
              pendingAssignmentsCount: assignments.length,
              availableNotesCount: notes.length
            }
          })
        });

        if (!response.ok) {
          throw new Error('Server AI error');
        }

        const data = await response.json();
        const answerText = data.spokenText || phrases.notUnderstood;

        setMessages((prev) => [
          ...prev,
          {
            id: `jarvis-${Date.now()}`,
            sender: 'jarvis',
            text: answerText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actionTaken: data.source ? `Processed via ${data.source}` : undefined
          }
        ]);
        setIsThinking(false);
        speakResponse(answerText, () => {
          setAssistantState('listening_wake');
          setStatusMessage('💤 Microphone Standby • Say "Hey Jarvis" to activate');
        });
      } catch (err) {
        console.warn('AI query failed, responding with fallback:', err);
        const reply = phrases.notUnderstood;
        setMessages((prev) => [
          ...prev,
          {
            id: `jarvis-${Date.now()}`,
            sender: 'jarvis',
            text: reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setIsThinking(false);
        speakResponse(reply, () => {
          setAssistantState('listening_wake');
          setStatusMessage('💤 Microphone Standby • Say "Hey Jarvis" to activate');
        });
      }
    },
    [
      clearCountdown,
      voiceSettings,
      firstName,
      onNavigateTab,
      speakResponse,
      startCommandCountdown,
      currentUser,
      assignments,
      notes,
      activeTab
    ]
  );

  /**
   * Activate Jarvis:
   * 1. Plays wake chime
   * 2. Opens HUD
   * 3. Greets: "Yes, how can I help you?"
   * 4. Starts strict 3-second countdown window
   */
  const activateJarvis = useCallback(() => {
    stopJarvisSpeech();
    clearCountdown();
    playJarvisWakeSound();
    setIsOpen(true);
    setAssistantState('active_greeting');
    setStatusMessage('Jarvis activated. Please give your command.');

    const phrases = getJarvisPhrases(voiceSettings.language, voiceSettings.personality, firstName);
    const greetingText = phrases.greeting;

    setMessages((prev) => [
      ...prev,
      {
        id: `jarvis-wake-${Date.now()}`,
        sender: 'jarvis',
        text: greetingText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    speakResponse(greetingText, () => {
      // Exactly as specified: Jarvis starts 3-second countdown for user command!
      startCommandCountdown();
    });
  }, [clearCountdown, voiceSettings, firstName, speakResponse, startCommandCountdown]);

  /**
   * Handle user submitting a typed command
   */
  const handleTypedCommandSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!typedCommand.trim()) return;
    const cmd = typedCommand;
    setTypedCommand('');
    executeCommand(cmd);
  };

  /**
   * Initialize Web Speech Recognition
   * Listens for "Hey Jarvis" during standby, or captures user command during 3s window
   */
  useEffect(() => {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setMicSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      // Set speech recognition language matching selected language option!
      recognition.lang = getSpeechLangCode(voiceSettings.language);

      recognition.onstart = () => {
        setIsMicListening(true);
      };

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        // Prevent feedback loop while Jarvis is speaking
        if (isSpeakingRef.current) return;

        let interim = '';
        let finalTranscript = '';

        for (let i = 0; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        const speech = (finalTranscript || interim).trim();
        setTranscript(speech);
        const lower = speech.toLowerCase();

        // 1. WAKE-WORD DETECTION ("Hey Jarvis", "Jarvis")
        if (!isAwaitingCommandRef.current && !isSpeakingRef.current) {
          const isWake =
            lower.includes('hey jarvis') ||
            lower.includes('jarvis') ||
            lower.includes('ok jarvis') ||
            lower.includes('hey study phantom') ||
            lower.includes('hey studysmart');

          if (isWake) {
            const afterWake = lower
              .replace(/hey jarvis/g, '')
              .replace(/ok jarvis/g, '')
              .replace(/jarvis/g, '')
              .trim();

            if (afterWake.length > 2) {
              // User said "Hey Jarvis" AND command in one breath (e.g. "Hey Jarvis open QR code system")
              // Directly execute hands-free without opening blocking modal overlay!
              stopJarvisSpeech();
              clearCountdown();
              executeCommand(afterWake);
            } else {
              // User just called Jarvis: "Hey Jarvis"
              activateJarvis();
            }
            return;
          }
        }

        // 2. COMMAND DETECTION DURING 3-SECOND WINDOW
        if (isAwaitingCommandRef.current && !isSpeakingRef.current) {
          // INTERRUPTION: If user begins speaking during 3-second window, clear/pause countdown immediately
          // so user gets adequate time to complete speaking their command without deactivation mid-sentence!
          if (interim.trim().length > 0 || finalTranscript.trim().length > 0) {
            clearCountdown();
            setStatusMessage(`Listening to command: "${(finalTranscript || interim).trim()}..."`);
          }

          if (finalTranscript) {
            const command = finalTranscript.trim();
            if (command.length > 0) {
              setTranscript('');
              executeCommand(command);
            }
          }
        }
      };

      recognition.onerror = (e: any) => {
        if (e.error !== 'no-speech' && e.error !== 'aborted') {
          console.warn('Speech recognition warning:', e.error);
        }
      };

      recognition.onend = () => {
        setIsMicListening(false);
        // Automatically restart speech recognition to keep "Hey Jarvis" wake word listening active if mic & wake-word are enabled
        if (wakeWordEnabled && micEnabled && !isSpeakingRef.current) {
          try {
            recognition.start();
          } catch {
            // Already active
          }
        }
      };

      recognitionRef.current = recognition;

      if (wakeWordEnabled && micEnabled) {
        try {
          recognition.start();
        } catch {
          // Ignore
        }
      } else {
        try {
          recognition.stop();
        } catch {
          // Ignore
        }
      }

      // Global event listener for header or other buttons
      const handleGlobalTrigger = () => {
        activateJarvis();
      };
      window.addEventListener('trigger-jarvis', handleGlobalTrigger);

      return () => {
        window.removeEventListener('trigger-jarvis', handleGlobalTrigger);
        try {
          recognition.stop();
        } catch {
          // Ignore
        }
      };
    } catch (err) {
      console.warn('SpeechRecognition init error:', err);
      setMicSupported(false);
    }
  }, [wakeWordEnabled, micEnabled, voiceSettings.language, activateJarvis, executeCommand, clearCountdown]);

  const activePersona =
    JARVIS_VOICES.find((v) => v.id === voiceSettings.voiceId) || JARVIS_VOICES[0];
  const activeLang =
    JARVIS_LANGUAGES.find((l) => l.code === voiceSettings.language) || JARVIS_LANGUAGES[0];

  return (
    <>
      {/* ============================================================== */}
      {/* GOOGLE ASSISTANT / SIRI STYLE TOP DYNAMIC ACTION BANNER        */}
      {/* Hands-free execution without blocking modal or clicking 'X'!   */}
      {/* ============================================================== */}
      {actionBanner && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto max-w-[94vw]">
          <div className="flex items-center gap-3.5 px-5 py-2.5 rounded-full bg-slate-900 border border-slate-700 text-white shadow-lg">
            {/* Icon */}
            <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500 flex items-center justify-center text-blue-400 shrink-0">
              {actionBanner.icon === 'qr' ? (
                <QrCode className="w-4 h-4 text-blue-400 animate-pulse" />
              ) : (
                <Zap className="w-4 h-4 text-blue-400 animate-pulse" />
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold uppercase text-blue-300 tracking-wider">
                  JARVIS AI • Hands-Free
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                {actionBanner.actionText}
              </span>
            </div>

            {/* Mini Equalizer Waves when speaking */}
            {isSpeaking && (
              <div className="flex items-center gap-0.5 ml-1 shrink-0">
                <span className="w-1 h-3 bg-blue-400 rounded-full animate-bounce delay-75" />
                <span className="w-1 h-5 bg-blue-300 rounded-full animate-bounce delay-150" />
                <span className="w-1 h-4 bg-blue-500 rounded-full animate-bounce delay-200" />
                <span className="w-1 h-2 bg-blue-300 rounded-full animate-bounce delay-100" />
              </div>
            )}

            {/* Auto executed checkmark badge */}
            <div className="ml-1 pl-2.5 border-l border-white/20 flex items-center gap-1 text-[11px] font-mono text-emerald-400 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
              <span className="hidden sm:inline">Executed</span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* FLOATING JARVIS ASSISTANT BUTTON (Bottom-Right)                */}
      {/* ============================================================== */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2 group">
        {/* Floating Tooltip Status */}
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-mono font-bold shadow-md transition-all duration-300 transform group-hover:scale-105">
          {assistantState === 'waiting_command' ? (
            <>
              <Mic className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
              <span className="text-amber-700 font-bold">🎙️ Mic Active: {countdownSeconds}s</span>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            </>
          ) : isSpeaking ? (
            <>
              <Activity className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span>Jarvis Speaking...</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span>Say "Hey Jarvis" to activate mic</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </>
          )}
        </div>

        {/* Clean Floating Assistant Button */}
        <button
          onClick={activateJarvis}
          title='Activate Jarvis Voice Assistant (Say "Hey Jarvis" or tap)'
          className={`relative w-15 h-15 sm:w-16 sm:h-16 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center cursor-pointer border-2 ${
            isSpeaking
              ? 'bg-blue-600 border-blue-300 text-white ring-4 ring-blue-200'
              : assistantState === 'waiting_command'
              ? 'bg-amber-600 border-amber-300 text-white ring-4 ring-amber-200 animate-bounce'
              : 'bg-blue-600 hover:bg-blue-700 border-white text-white'
          }`}
        >
          <div className="relative z-10 flex flex-col items-center justify-center">
            {isSpeaking ? (
              <Activity className="w-7 h-7 text-white animate-pulse" />
            ) : assistantState === 'waiting_command' ? (
              <div className="flex flex-col items-center">
                <span className="text-white font-mono font-black text-xs">
                  {countdownSeconds}s
                </span>
                <Mic className="w-4 h-4 text-white animate-bounce mt-0.5" />
              </div>
            ) : isThinking ? (
              <Sparkles className="w-7 h-7 text-white animate-spin" />
            ) : (
              <Bot className="w-7 h-7 text-white transition" />
            )}
          </div>
        </button>
      </div>

      {/* ============================================================== */}
      {/* FULL JARVIS ASSISTANT HUD MODAL                                */}
      {/* ============================================================== */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
            {/* Top Clean Accent Bar */}
            <div className="h-1.5 w-full bg-blue-600" />

            {/* HUD Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 tracking-wide">JARVIS AI Assistant</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-bold uppercase">
                      {voiceSettings.personality}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">
                    {activeLang.flag} {activeLang.name} • {activePersona.name} • {voiceSettings.rate}x
                  </p>
                </div>
              </div>

              {/* Header Action Controls */}
              <div className="flex items-center gap-2">
                {/* Voice Settings Modal Opener */}
                <button
                  onClick={() => {
                    if (onOpenSettings) {
                      setIsOpen(false);
                      onOpenSettings();
                    } else {
                      setIsVoiceSettingsOpen(true);
                    }
                  }}
                  title="Configure Jarvis Voice, Personality & Speed Settings"
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden sm:inline">Settings</span>
                </button>

                {/* Mute/Unmute */}
                <button
                  onClick={() => setSoundMuted(!soundMuted)}
                  title={soundMuted ? 'Unmute speech output' : 'Mute speech output'}
                  className={`p-2 rounded-xl border transition cursor-pointer ${
                    soundMuted
                      ? 'bg-rose-50 border-rose-200 text-rose-600'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                {/* Close Button */}
                <button
                  onClick={() => {
                    stopJarvisSpeech();
                    clearCountdown();
                    setIsOpen(false);
                  }}
                  className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Controls Bar: Start Jarvis, Mic Button, Voice & Language Dropdowns */}
            <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2">
                {/* Start Jarvis Button */}
                <button
                  onClick={activateJarvis}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold font-mono text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Start Jarvis</span>
                </button>

                {/* Microphone Toggle Button */}
                <button
                  onClick={activateJarvis}
                  title="Click to speak command"
                  className={`p-1.5 rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                    assistantState === 'waiting_command'
                      ? 'bg-amber-500 text-white border-amber-500 font-bold animate-pulse'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                  <span className="hidden md:inline font-mono text-[11px]">
                    {assistantState === 'waiting_command' ? 'Listening...' : 'Voice Mic'}
                  </span>
                </button>
              </div>

              {/* Language & Voice Dropdowns */}
              <div className="flex items-center gap-2">
                {/* Language Dropdown */}
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2 py-1">
                  <Globe className="w-3 h-3 text-blue-600" />
                  <select
                    value={voiceSettings.language}
                    onChange={(e) => {
                      const newLang = e.target.value;
                      handleSaveSettings({ ...voiceSettings, language: newLang });
                    }}
                    className="bg-transparent text-slate-800 text-[11px] font-mono focus:outline-none cursor-pointer"
                  >
                    {JARVIS_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code} className="bg-white text-slate-900">
                        {l.flag} {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Voice Persona Dropdown */}
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2 py-1">
                  <Radio className="w-3 h-3 text-blue-600" />
                  <select
                    value={voiceSettings.voiceId}
                    onChange={(e) => {
                      const newVoiceId = e.target.value;
                      handleSaveSettings({ ...voiceSettings, voiceId: newVoiceId, deviceVoiceURI: '' });
                    }}
                    className="bg-transparent text-slate-800 text-[11px] font-mono focus:outline-none cursor-pointer max-w-[155px] truncate"
                  >
                    <optgroup label="👨 Male Assistant Voices" className="bg-white text-blue-700 font-bold">
                      {JARVIS_VOICES.filter((v) => v.preferGender === 'male').map((v) => (
                        <option key={v.id} value={v.id} className="bg-white text-slate-900 font-normal">
                          {v.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="👩 Female & Other Voices" className="bg-white text-slate-700 font-bold">
                      {JARVIS_VOICES.filter((v) => v.preferGender !== 'male').map((v) => (
                        <option key={v.id} value={v.id} className="bg-white text-slate-900 font-normal">
                          {v.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>

            {/* Interactive Visualizer & Status Stage */}
            <div className="p-5 flex flex-col items-center justify-center bg-slate-50/50 border-b border-slate-200 relative overflow-hidden">
              {/* Clean Concentric Rings */}
              <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full flex items-center justify-center">
                <div
                  className={`absolute inset-0 rounded-full border-2 border-dashed transition-all duration-700 ${
                    isSpeaking
                      ? 'border-blue-600 animate-spin duration-3000 scale-105'
                      : assistantState === 'waiting_command'
                      ? 'border-amber-500 animate-pulse scale-105'
                      : isThinking
                      ? 'border-blue-500 animate-spin duration-1500 scale-105'
                      : 'border-slate-300'
                  }`}
                />

                <div
                  className={`absolute inset-3 rounded-full border transition-all duration-500 ${
                    isSpeaking
                      ? 'border-blue-300'
                      : assistantState === 'waiting_command'
                      ? 'border-amber-300'
                      : 'border-slate-200'
                  }`}
                />

                {/* Central Orb Button */}
                <button
                  onClick={activateJarvis}
                  className={`w-22 h-22 sm:w-24 sm:h-24 rounded-full bg-white border-2 flex flex-col items-center justify-center shadow-md relative z-10 transform hover:scale-105 transition cursor-pointer ${
                    assistantState === 'waiting_command'
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-blue-600'
                  }`}
                >
                  {isSpeaking ? (
                    <Activity className="w-9 h-9 text-blue-600 animate-pulse" />
                  ) : assistantState === 'waiting_command' ? (
                    <div className="flex flex-col items-center">
                      <span className="text-2xl font-black font-mono text-amber-600">
                        {countdownSeconds}s
                      </span>
                      <Mic className="w-5 h-5 text-amber-600 animate-bounce mt-0.5" />
                      <span className="text-[9px] font-mono text-amber-700 font-bold uppercase">
                        Mic Active
                      </span>
                    </div>
                  ) : isThinking ? (
                    <Sparkles className="w-9 h-9 text-blue-600 animate-spin" />
                  ) : (
                    <Bot className="w-9 h-9 text-blue-600" />
                  )}
                  {assistantState !== 'waiting_command' && (
                    <span className="text-[9px] font-mono uppercase font-bold text-slate-600 mt-1">
                      {isSpeaking ? 'Speaking' : isThinking ? 'Processing' : 'Say "Hey Jarvis"'}
                    </span>
                  )}
                </button>
              </div>

              {/* Status Message Display */}
              <div className="mt-4 text-center space-y-2 max-w-md w-full">
                {assistantState === 'waiting_command' ? (
                  <div className="space-y-1.5 animate-in zoom-in-95">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-amber-800 text-xs font-mono font-bold">
                      <Mic className="w-4 h-4 text-amber-600 animate-bounce" />
                      <span>🎙️ Microphone Active! Speak command: {countdownSeconds}s</span>
                    </div>
                    {/* Visual 3s Countdown Bar */}
                    <div className="w-56 mx-auto bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full transition-all duration-1000 ease-linear"
                        style={{ width: `${(countdownSeconds / 3) * 100}%` }}
                      />
                    </div>
                    <p className="text-[11px] font-mono text-slate-600">
                      Say "Open QR attendance", "Open study", "Create flashcard", etc.
                    </p>
                  </div>
                ) : assistantState === 'deactivated_timeout' ? (
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono font-bold">
                    <RotateCcw className="w-4 h-4 text-rose-600" />
                    <span>Microphone turned off. Say "Hey Jarvis" to activate again.</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono font-bold">
                    <Radio className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                    <span>💤 Microphone Standby • Say "Hey Jarvis" to activate</span>
                  </div>
                )}

                {/* Live Heard Transcript Preview */}
                {transcript && (
                  <p className="text-xs font-mono text-slate-600 max-w-md mx-auto truncate px-4 py-1 rounded-lg bg-white border border-slate-200">
                    🎙️ Heard: "{transcript}"
                  </p>
                )}
              </div>

              {/* Stop Speaking Button */}
              {isSpeaking && (
                <button
                  onClick={stopJarvisSpeech}
                  className="mt-3 px-4 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Stop Speaking (Silence)</span>
                </button>
              )}
            </div>

            {/* Conversation Log */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 max-h-52 sm:max-h-60 bg-white">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none shadow-xs'
                        : msg.isDeactivationNotice
                        ? 'bg-rose-50 border border-rose-200 text-rose-800 rounded-bl-none'
                        : 'bg-slate-100 border border-slate-200 text-slate-800 rounded-bl-none'
                    }`}
                  >
                    <div className={`flex items-center gap-1.5 mb-1 text-[10px] font-mono ${
                      msg.sender === 'user' ? 'text-blue-100' : 'text-slate-500'
                    }`}>
                      {msg.sender === 'user' ? (
                        <span>You ({firstName})</span>
                      ) : (
                        <span className="flex items-center gap-1 font-bold text-blue-600">
                          <Zap className="w-3 h-3 text-blue-600" />
                          <span>JARVIS</span>
                        </span>
                      )}
                      <span>• {msg.timestamp}</span>
                    </div>

                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {msg.actionTaken && (
                      <div className="mt-2 pt-2 border-t border-slate-200 flex items-center gap-1 text-[11px] font-mono text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{msg.actionTaken}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Standard Quick Command Chips */}
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>Try speaking or clicking any command:</span>
                <span className="text-blue-600 font-semibold">3s Command Rule Active</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  'Open QR attendance',
                  'Open Study',
                  'Create Flashcard',
                  'Start Quiz',
                  'Open Notes',
                  'Hello Jarvis',
                  'Start Pomodoro'
                ].map((cmd, idx) => (
                  <button
                    key={idx}
                    onClick={() => executeCommand(cmd)}
                    className="px-2.5 py-1 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-xs text-slate-700 hover:text-blue-700 transition flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <Terminal className="w-3 h-3 text-blue-600" />
                    <span>"{cmd}"</span>
                  </button>
                ))}
              </div>
            </div>

            {/* DUAL COMMAND INPUT: TEXT INPUT BOX + SEND BUTTON */}
            <form
              onSubmit={handleTypedCommandSubmit}
              className="p-3.5 bg-white border-t border-slate-200 flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={typedCommand}
                  onFocus={() => {
                    if (isAwaitingCommandRef.current) {
                      clearCountdown();
                      setStatusMessage('Composing command... Press Send or Enter');
                    }
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTypedCommand(val);
                    if (isAwaitingCommandRef.current && val.trim().length > 0) {
                      clearCountdown();
                      setStatusMessage('Composing command... Press Send or Enter');
                    }
                  }}
                  placeholder='Type a command (e.g. "Open Study", "Create Flashcard", "Start Quiz")...'
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 rounded-2xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={!typedCommand.trim()}
                className={`px-4 py-2.5 rounded-2xl font-bold font-mono text-xs flex items-center gap-1.5 transition ${
                  typedCommand.trim()
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ADVANCED VOICE SETTINGS MODAL                                  */}
      {/* ============================================================== */}
      <VoiceSettingsModal
        isOpen={isVoiceSettingsOpen}
        onClose={() => setIsVoiceSettingsOpen(false)}
        settings={voiceSettings}
        onSaveSettings={handleSaveSettings}
        userName={currentUser.name}
      />
    </>
  );
};
