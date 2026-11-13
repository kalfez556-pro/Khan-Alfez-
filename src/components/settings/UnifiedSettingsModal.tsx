import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Division, Role } from '../../types';
import {
  VoiceSettings,
  JARVIS_VOICES,
  JARVIS_LANGUAGES,
  DEFAULT_VOICE_SETTINGS,
  speakJarvisMessage,
  stopJarvisSpeech,
  getJarvisPhrases,
  playJarvisActionSound,
  playSuccessChime,
  playWarningBuzzer
} from '../../utils/audio';
import { triggerQuickSparkle } from '../../utils/confetti';
import {
  Settings,
  User,
  UserCheck,
  UserCog,
  Mail,
  Camera,
  Upload,
  Link as LinkIcon,
  Flame,
  Bot,
  Mic,
  MicOff,
  Radio,
  Sliders,
  Globe,
  Check,
  X,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Clock,
  PlayCircle,
  Activity,
  RotateCcw,
  ExternalLink,
  Zap,
  Volume2,
  Award,
  CheckCircle2,
  LogOut,
  Building,
  GraduationCap,
  Layers,
  ChevronRight,
  Gem,
  Phone
} from 'lucide-react';

interface UnifiedSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  allUsers?: UserProfile[];
  onSwitchUser?: (user: UserProfile) => void;
  onUpdateProfile?: (updatedUser: UserProfile) => void;
  onOpenAuthPortal?: () => void;
  onOpenProfileModal?: () => void;
  voiceSettings: VoiceSettings;
  onSaveVoiceSettings: (newSettings: VoiceSettings) => void;
  wakeWordEnabled: boolean;
  onToggleWakeWord: (enabled: boolean) => void;
  micEnabled: boolean;
  onToggleMic: (enabled: boolean) => void;
  onNavigateTab: (tabId: string) => void;
  onActivateStreakFreeze?: () => void;
  defaultTab?: 'profile' | 'gems_streak' | 'jarvis';
}

// Preset avatars for profile customization
const PRESET_AVATARS = [
  {
    category: 'Student',
    avatars: [
      { name: 'Casual Tech', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=250&q=80' },
      { name: 'Research Scholar', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80' },
      { name: 'Campus Creator', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80' },
      { name: 'Engineering Dev', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80' },
      { name: 'Library Focus', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80' },
      { name: 'Lab Fellow', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80' },
      { name: 'Code Ace', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=250&q=80' },
      { name: 'Algorithms Lead', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80' }
    ]
  },
  {
    category: 'Faculty',
    avatars: [
      { name: 'Professor Sharma', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=250&q=80' },
      { name: 'Dr. Nambiar', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80' },
      { name: 'Department Head', url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=250&q=80' },
      { name: 'Research Mentor', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=250&q=80' }
    ]
  }
];

export const UnifiedSettingsModal: React.FC<UnifiedSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers = [],
  onSwitchUser,
  onUpdateProfile,
  onOpenAuthPortal,
  voiceSettings,
  onSaveVoiceSettings,
  wakeWordEnabled,
  onToggleWakeWord,
  micEnabled,
  onToggleMic,
  onNavigateTab,
  onActivateStreakFreeze,
  defaultTab = 'profile'
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'gems_streak' | 'jarvis'>(defaultTab);

  // Profile editing state
  const [profileName, setProfileName] = useState(currentUser.name);
  const [profileEmail, setProfileEmail] = useState(currentUser.email);
  const [profileRollNumber, setProfileRollNumber] = useState(currentUser.rollNumber || '');
  const [profileTitle, setProfileTitle] = useState(currentUser.title);
  const [profileDepartment, setProfileDepartment] = useState(currentUser.department);
  const [profileDivision, setProfileDivision] = useState<Division>(currentUser.division || 'A');
  const [profileParentPhone, setProfileParentPhone] = useState(currentUser.parentPhone || '');
  const [profileAvatar, setProfileAvatar] = useState(currentUser.avatar);

  // Photo change tools
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [profileSavedMessage, setProfileSavedMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice assistant settings state
  const [localVoiceSettings, setLocalVoiceSettings] = useState<VoiceSettings>(voiceSettings);
  const [localWakeWord, setLocalWakeWord] = useState<boolean>(wakeWordEnabled);
  const [localMic, setLocalMic] = useState<boolean>(micEnabled);
  const [isTestingVoice, setIsTestingVoice] = useState<boolean>(false);
  const [deviceVoices, setDeviceVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceGenderFilter, setVoiceGenderFilter] = useState<'all' | 'male' | 'female'>('male');
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);

  // Sync state when modal opens or currentUser changes
  useEffect(() => {
    if (isOpen) {
      setLocalVoiceSettings(voiceSettings);
      setLocalWakeWord(wakeWordEnabled);
      setLocalMic(micEnabled);
      setSavedSuccessMessage(null);
      setProfileSavedMessage(null);
      setProfileName(currentUser.name);
      setProfileEmail(currentUser.email);
      setProfileRollNumber(currentUser.rollNumber || '');
      setProfileTitle(currentUser.title);
      setProfileDepartment(currentUser.department);
      setProfileDivision(currentUser.division || 'A');
      setProfileParentPhone(currentUser.parentPhone || '');
      setProfileAvatar(currentUser.avatar);
    }
  }, [isOpen, currentUser, voiceSettings, wakeWordEnabled, micEnabled]);

  // Load OS device voices
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const allVoices = window.speechSynthesis.getVoices();
        const seen = new Set<string>();
        const unique: SpeechSynthesisVoice[] = [];
        for (const v of allVoices) {
          const id = `${v.voiceURI || v.name}__${v.lang}`;
          if (!seen.has(id)) {
            seen.add(id);
            unique.push(v);
          }
        }
        setDeviceVoices(unique);
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

  // Handle local image file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      playWarningBuzzer();
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      playWarningBuzzer();
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setProfileAvatar(event.target.result as string);
        triggerQuickSparkle();
        setIsAvatarPickerOpen(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Apply custom URL for photo
  const handleApplyCustomUrl = () => {
    if (!customPhotoUrl.trim()) return;
    setProfileAvatar(customPhotoUrl.trim());
    setCustomPhotoUrl('');
    setShowUrlInput(false);
    setIsAvatarPickerOpen(false);
    triggerQuickSparkle();
  };

  // Handle saving personal profile changes
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) return;

    const updated: UserProfile = {
      ...currentUser,
      name: profileName.trim(),
      email: profileEmail.trim(),
      rollNumber: profileRollNumber.trim() || undefined,
      title: profileTitle.trim(),
      department: profileDepartment.trim(),
      division: profileDivision,
      parentPhone: currentUser.role === 'student' ? profileParentPhone.trim() || undefined : undefined,
      avatar: profileAvatar
    };

    onUpdateProfile?.(updated);
    playSuccessChime();
    triggerQuickSparkle();
    setProfileSavedMessage('Profile updated successfully!');
    setTimeout(() => {
      setProfileSavedMessage(null);
    }, 3500);
  };

  // Handle voice tester
  const handleTestVoice = () => {
    stopJarvisSpeech();
    setIsTestingVoice(true);
    playJarvisActionSound();

    const phrases = getJarvisPhrases(
      localVoiceSettings.language,
      localVoiceSettings.personality,
      currentUser.name
    );

    let testPhrase = phrases.greeting;
    if (localVoiceSettings.language === 'hinglish') {
      testPhrase = localVoiceSettings.personality === 'witty'
        ? 'Haan bhai, Jarvis ready hai! Batao aaj kaunsa assignment ya quiz crack karna hai?'
        : localVoiceSettings.personality === 'casual'
        ? `Hey ${currentUser.name.split(' ')[0]}! Sab set hai, batao aaj kya help chahiye?`
        : `Haan ${currentUser.name.split(' ')[0]}, Jarvis online hai. Bataiye aapki kya help kar sakta hoon?`;
    } else if (localVoiceSettings.language === 'hi-IN') {
      testPhrase = localVoiceSettings.personality === 'witty'
        ? 'हुक्म कीजिए, क्या सहायता चाहिए? जार्विस तैयार है।'
        : 'नमस्ते! मैं जार्विस हूँ। बताइए मैं आपकी क्या सहायता करूँ?';
    } else if (localVoiceSettings.language === 'mr-IN') {
      testPhrase = 'नमस्कार! मी जार्विस आहे. सांगा आज आपण काय अभ्यास करणार आहोत?';
    } else {
      testPhrase = localVoiceSettings.personality === 'witty'
        ? `Yes ${currentUser.name.split(' ')[0]}, how can I help you? Or are we saving the semester again?`
        : localVoiceSettings.personality === 'casual'
        ? `Hey ${currentUser.name.split(' ')[0]}! What can I do for you today? Ready when you are.`
        : `Yes ${currentUser.name.split(' ')[0]}, how can I help you? All systems are fully operational.`;
    }

    speakJarvisMessage(testPhrase, {
      voiceId: localVoiceSettings.voiceId,
      deviceVoiceURI: localVoiceSettings.deviceVoiceURI,
      language: localVoiceSettings.language,
      rate: localVoiceSettings.rate,
      pitch: localVoiceSettings.pitch,
      onStart: () => setIsTestingVoice(true),
      onEnd: () => setIsTestingVoice(false),
      onError: () => setIsTestingVoice(false)
    });
  };

  const handleSaveAll = () => {
    stopJarvisSpeech();
    onSaveVoiceSettings(localVoiceSettings);
    onToggleWakeWord(localWakeWord);
    onToggleMic(localMic);
    setSavedSuccessMessage('Settings saved successfully!');
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const speedPresets = [
    { label: '0.85x Cinematic', value: 0.85 },
    { label: '1.0x Normal', value: 1.0 },
    { label: '1.15x Fast', value: 1.15 },
    { label: '1.30x Turbo', value: 1.3 }
  ];

  const pitchPresets = [
    { label: '0.82x Deep Baritone', value: 0.82 },
    { label: '1.0x Balanced', value: 1.0 },
    { label: '1.15x Bright', value: 1.15 }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Accent Line */}
        <div className="h-1.5 w-full bg-blue-600" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Application Settings</h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                  currentUser.role === 'faculty' ? 'bg-slate-200 text-slate-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {currentUser.role === 'faculty' ? 'Faculty Portal' : 'Student Portal'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Manage personal profile, gems balance, streak rewards, and Jarvis voice assistant
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

        {/* Tab Selection Navigation (3 Organized Hubs) */}
        <div className="flex border-b border-slate-200 bg-slate-100/60 p-1.5 gap-1.5 overflow-x-auto scrollbar-none">
          {/* Tab 1: Profile & Portal */}
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <User className={`w-4 h-4 ${activeTab === 'profile' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span>Profile & Portal</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-bold hidden sm:inline">
              {currentUser.role === 'faculty' ? 'Faculty' : `Div ${currentUser.division || 'A'}`}
            </span>
          </button>

          {/* Tab 2: Gems & Streak */}
          <button
            onClick={() => setActiveTab('gems_streak')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'gems_streak'
                ? 'bg-white text-orange-600 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${activeTab === 'gems_streak' ? 'text-amber-500 animate-pulse' : 'text-slate-400'}`} />
            <span>Gems & Streak</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
              {currentUser.gems}💎
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-orange-100 text-orange-700 font-bold hidden sm:inline">
              {currentUser.streakDays}d🔥
            </span>
          </button>

          {/* Tab 3: Jarvis / Voice Assistant */}
          <button
            onClick={() => setActiveTab('jarvis')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'jarvis'
                ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Bot className={`w-4 h-4 ${activeTab === 'jarvis' ? 'text-blue-600' : 'text-slate-400'}`} />
            <span>Jarvis AI Voice</span>
            <span className={`w-2 h-2 rounded-full ${localWakeWord && localMic ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'}`} />
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* ========================================================= */}
          {/* TAB 1: PERSONAL PROFILE & STUDENT/FACULTY PORTAL          */}
          {/* ========================================================= */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Profile Card Header */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/80 border border-indigo-100 shadow-xs flex flex-col sm:flex-row items-center gap-4">
                <div className="relative group">
                  <img
                    src={profileAvatar}
                    alt={currentUser.name}
                    className="w-20 h-20 rounded-2xl object-cover ring-2 ring-indigo-500 shadow-md"
                    onError={(e) => {
                      e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><rect width="60" height="60" fill="%236366f1"/><text x="50%" y="55%" font-family="sans-serif" font-size="24" font-weight="bold" fill="%23ffffff" dominant-baseline="middle" text-anchor="middle">${encodeURIComponent(currentUser.name.charAt(0))}</text></svg>`;
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setIsAvatarPickerOpen(!isAvatarPickerOpen)}
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-indigo-600 text-white shadow-md hover:bg-indigo-500 transition cursor-pointer"
                    title="Change Photo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 text-center sm:text-left min-w-0">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h4 className="text-base font-bold text-slate-900 truncate">{currentUser.name}</h4>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                      currentUser.role === 'faculty' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {currentUser.role === 'faculty' ? 'Faculty Member' : `Student • Div ${currentUser.division || 'A'}`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">
                    {currentUser.role === 'student' ? `Roll No: ${currentUser.rollNumber}` : currentUser.title}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {currentUser.department} • {currentUser.email}
                  </p>
                </div>

                <div className="shrink-0 flex sm:flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAvatarPickerOpen(!isAvatarPickerOpen)}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-indigo-700 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Change Avatar</span>
                  </button>
                </div>
              </div>

              {/* Avatar Selector Tray */}
              {isAvatarPickerOpen && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Select Avatar Photo
                    </span>
                    <button
                      onClick={() => setIsAvatarPickerOpen(false)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Preset Avatars */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-slate-500">Preset Academic Portraits:</span>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {PRESET_AVATARS.flatMap((cat) => cat.avatars).map((av, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setProfileAvatar(av.url);
                            triggerQuickSparkle();
                          }}
                          className={`relative rounded-xl overflow-hidden aspect-square border-2 transition transform hover:scale-105 cursor-pointer ${
                            profileAvatar === av.url ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-slate-200'
                          }`}
                          title={av.name}
                        >
                          <img src={av.url} alt={av.name} className="w-full h-full object-cover" />
                          {profileAvatar === av.url && (
                            <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center text-white">
                              <Check className="w-4 h-4 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Upload Local Image or Custom URL */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload from Device</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span>Enter Image URL</span>
                    </button>
                  </div>

                  {showUrlInput && (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="url"
                        value={customPhotoUrl}
                        onChange={(e) => setCustomPhotoUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/... or image link"
                        className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCustomUrl}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Personal Profile Edit Form */}
              <form onSubmit={handleSaveProfile} className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCog className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Edit Personal Profile Information
                    </h4>
                  </div>
                  {profileSavedMessage && (
                    <span className="text-xs font-mono font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{profileSavedMessage}</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {currentUser.role === 'student' ? (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Roll Number (ID)
                      </label>
                      <input
                        type="text"
                        value={profileRollNumber}
                        onChange={(e) => setProfileRollNumber(e.target.value)}
                        placeholder="e.g. 21BCE1042"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Academic Title / Designation
                      </label>
                      <input
                        type="text"
                        value={profileTitle}
                        onChange={(e) => setProfileTitle(e.target.value)}
                        placeholder="e.g. Professor & Division A Mentor"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Branch / Department
                    </label>
                    <input
                      type="text"
                      value={profileDepartment}
                      onChange={(e) => setProfileDepartment(e.target.value)}
                      placeholder="e.g. AIML, Pharmacy, Law, Architecture, CSE"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Academic Division
                    </label>
                    <select
                      value={profileDivision}
                      onChange={(e) => setProfileDivision(e.target.value as Division)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                    >
                      <option value="A">Division A</option>
                      <option value="B">Division B</option>
                    </select>
                  </div>

                  {currentUser.role === 'student' && (
                    <div className="sm:col-span-2">
                      <label className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-blue-600" />
                          <span>Parent / Guardian Mobile Number</span>
                        </span>
                        <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          Focus Lock 4-Digit OTP
                        </span>
                      </label>
                      <input
                        type="tel"
                        value={profileParentPhone}
                        onChange={(e) => setProfileParentPhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Profile Changes</span>
                  </button>
                </div>
              </form>

              {/* Student / Faculty Portal & Account Switcher */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Student & Faculty Portal Navigation
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                    Active Session
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {currentUser.role === 'faculty' ? 'Faculty Academic Portal' : 'Student Academic Ecosystem Portal'}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Access all class rosters, assignments, QR attendance, notes, and leaderboard
                    </p>
                  </div>

                  {onOpenAuthPortal && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAuthPortal();
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
                    >
                      <LogOut className="w-3.5 h-3.5 text-blue-400" />
                      <span>Switch to Welcome / Login Portal</span>
                    </button>
                  )}
                </div>

                {/* Perspective Account Switcher */}
                {allUsers.length > 1 && onSwitchUser && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-600">
                      Switch Perspective Account:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {allUsers.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => {
                            onSwitchUser(user);
                            setProfileSavedMessage(`Switched perspective to ${user.name}`);
                          }}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                            currentUser.id === user.id
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-950 shadow-xs'
                              : 'bg-white hover:bg-slate-100/80 border-slate-200 text-slate-700'
                          }`}
                        >
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-300 shrink-0"
                            onError={(e) => {
                              e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><rect width="60" height="60" fill="%236366f1"/><text x="50%" y="55%" font-family="sans-serif" font-size="24" font-weight="bold" fill="%23ffffff" dominant-baseline="middle" text-anchor="middle">${encodeURIComponent(user.name.charAt(0))}</text></svg>`;
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold truncate">{user.name}</span>
                              <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold uppercase ${
                                user.role === 'faculty' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {user.role === 'faculty' ? 'Faculty' : `Div ${user.division}`}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 block truncate">
                              {user.role === 'faculty' ? user.title : `${user.rollNumber} • ${user.gems} Gems`}
                            </span>
                          </div>
                          {currentUser.id === user.id && (
                            <UserCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: GEMS & STREAK REWARDS                              */}
          {/* ========================================================= */}
          {activeTab === 'gems_streak' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* SECTION A: GEMS VAULT & BALANCE */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white shadow-lg shadow-amber-500/20 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center gap-4 text-center sm:text-left relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-inner backdrop-blur-md shrink-0">
                    <Sparkles className="w-9 h-9 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="text-3xl font-black tracking-tight">{currentUser.gems}</span>
                      <span className="text-sm font-bold uppercase font-mono tracking-wider bg-white/25 px-2 py-0.5 rounded-lg">
                        Gems Balance
                      </span>
                    </div>
                    <p className="text-xs text-amber-100 font-medium mt-1">
                      Academic Study Reward Credits • Multiplier Active: <strong>1.5x Multiplier</strong>
                    </p>
                  </div>
                </div>

                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-2">
                  <button
                    onClick={() => {
                      onNavigateTab('store');
                      onClose();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-white text-orange-700 hover:bg-amber-50 font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Gem className="w-4 h-4 text-amber-600" />
                    <span>Explore Rewards Store</span>
                  </button>
                </div>
              </div>

              {/* How to Earn Gems Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span>How to Earn More Academic Gems</span>
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500">Live Reward Matrix</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl bg-white border border-slate-200 text-center">
                    <span className="text-xs font-black text-amber-600 font-mono">+50 Gems</span>
                    <span className="text-[11px] text-slate-600 block mt-0.5 font-medium">Lab Submission</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-200 text-center">
                    <span className="text-xs font-black text-emerald-600 font-mono">+25 Gems</span>
                    <span className="text-[11px] text-slate-600 block mt-0.5 font-medium">QR Attendance</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-200 text-center">
                    <span className="text-xs font-black text-indigo-600 font-mono">+20 Gems</span>
                    <span className="text-[11px] text-slate-600 block mt-0.5 font-medium">Quiz Top 3</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-200 text-center">
                    <span className="text-xs font-black text-orange-600 font-mono">+15 Gems</span>
                    <span className="text-[11px] text-slate-600 block mt-0.5 font-medium">25m Focus Block</span>
                  </div>
                </div>
              </div>

              {/* SECTION B: STREAK STATUS & SETTINGS */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 border-2 border-orange-300 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-center sm:text-left">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
                    <Flame className="w-9 h-9 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="text-2xl font-black text-orange-950">
                        {currentUser.streakDays} Days
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-orange-200/90 text-orange-800 text-[10px] font-mono font-bold uppercase">
                        Active Streak 🔥
                      </span>
                    </div>
                    <p className="text-xs text-orange-800/90 mt-0.5 font-medium">
                      Continuous Daily Study Log: Streak multiplier is applied to all quiz and attendance rewards!
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center sm:items-end gap-1.5 shrink-0">
                  <span className="text-[11px] font-mono bg-white border border-orange-300 text-orange-900 px-3 py-1 rounded-xl shadow-xs font-bold">
                    Next Goal: {currentUser.streakDays < 7 ? `${7 - currentUser.streakDays} days to 7-Day milestone` : '14-Day Scholar'}
                  </span>
                </div>
              </div>

              {/* Streak Protection & Freeze Status */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {currentUser.hasStreakFreeze ? (
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <ShieldAlert className="w-5 h-5 text-amber-600" />
                    )}
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Streak Protection Freeze Shield
                    </h4>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    currentUser.hasStreakFreeze
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {currentUser.hasStreakFreeze ? 'Shield Armed 🛡️' : 'Not Armed'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {currentUser.hasStreakFreeze
                    ? 'Your streak is currently protected! If you miss a study session tomorrow, your streak count will remain intact.'
                    : 'A Streak Freeze automatically protects your streak from breaking if you are unable to log in for a day.'}
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {!currentUser.hasStreakFreeze && onActivateStreakFreeze && (
                    <button
                      onClick={onActivateStreakFreeze}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Equip 1-Day Streak Shield</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onNavigateTab('store');
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                    <span>View Streak Freeze & Store Perks</span>
                  </button>
                </div>
              </div>

              {/* Focus Session Trigger to Keep Streak Alive */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Daily Study Milestone Progress</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-slate-700">3-Day Milestone</span>
                    <span className="text-xs font-mono text-emerald-600 font-bold mt-1">Unlocked (+25 Gems)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-slate-700">7-Day Consistency</span>
                    <span className="text-xs font-mono text-orange-600 font-bold mt-1">
                      {currentUser.streakDays >= 7 ? 'Unlocked 🔥' : `${7 - currentUser.streakDays} days left`}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-slate-700">14-Day Scholar</span>
                    <span className="text-xs font-mono text-indigo-600 font-bold mt-1">
                      {currentUser.streakDays >= 14 ? 'Unlocked 🎓' : `${14 - currentUser.streakDays} days left`}
                    </span>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => {
                      onNavigateTab('pomodoro');
                      onClose();
                    }}
                    className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Start 25-Min Focus Session to Keep Streak Alive</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: JARVIS VOICE ASSISTANT SETTINGS                    */}
          {/* ========================================================= */}
          {activeTab === 'jarvis' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Section 3.1: Microphones & Ambient Wake Word Toggles */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Mic className="w-4 h-4 text-indigo-600" />
                  <span>Microphone & Ambient Wake-Word Controls</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Master Microphone Toggle */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">Microphone Input</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                          localMic ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {localMic ? 'ENABLED' : 'MUTED'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Speech recognition engine for voice commands
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setLocalMic(!localMic)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        localMic ? 'bg-indigo-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          localMic ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* "Hey Jarvis" Wake-Word Listening Toggle */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">"Hey Jarvis" Wake Word</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                          localWakeWord ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {localWakeWord ? 'LISTENING' : 'OFF'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Activate Jarvis hands-free by saying "Hey Jarvis"
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setLocalWakeWord(!localWakeWord)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        localWakeWord ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          localWakeWord ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-2 text-blue-900 text-xs">
                  <Zap className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>3-Second Smart Rule:</strong> After Jarvis responds to "Hey Jarvis", speak or type your command. Starting speech or typing pauses the timer immediately to ensure your command is completed without deactivation.
                  </span>
                </div>
              </div>

              {/* Section 3.2: Language Selection Dropdown */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-600" />
                    <span>Language Selection</span>
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500">
                    Microphone & Speech Engine Sync
                  </span>
                </div>

                <select
                  value={localVoiceSettings.language}
                  onChange={(e) =>
                    setLocalVoiceSettings((prev) => ({
                      ...prev,
                      language: e.target.value
                    }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {JARVIS_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name} ({lang.nativeName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Section 3.3: Jarvis Male AI Voice Selection */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-indigo-600" />
                      <span>Jarvis AI Voice Selection (Male Voice Preferred)</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Deep cinematic baritone voice modeled after modern AI assistants
                    </p>
                  </div>

                  <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-0.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setVoiceGenderFilter('male')}
                      className={`px-2 py-1 rounded-lg font-bold cursor-pointer transition ${
                        voiceGenderFilter === 'male' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Male Voices
                    </button>
                    <button
                      type="button"
                      onClick={() => setVoiceGenderFilter('all')}
                      className={`px-2 py-1 rounded-lg font-bold cursor-pointer transition ${
                        voiceGenderFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-1">
                  {JARVIS_VOICES.filter((v) => (voiceGenderFilter === 'male' ? v.preferGender === 'male' : true)).map((voice) => {
                    const isSelected = localVoiceSettings.voiceId === voice.id;
                    return (
                      <div
                        key={voice.id}
                        onClick={() =>
                          setLocalVoiceSettings((prev) => ({
                            ...prev,
                            voiceId: voice.id,
                            pitch: voice.pitch || prev.pitch
                          }))
                        }
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-400 shadow-sm text-indigo-950 ring-1 ring-indigo-400'
                            : 'bg-white hover:bg-slate-100/70 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                              isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Bot className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold">{voice.name}</span>
                              {voice.preferGender === 'male' && (
                                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-indigo-100 text-indigo-700 font-bold uppercase">
                                  Male
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 block truncate max-w-[220px]">
                              {voice.badge} • {voice.tagline}
                            </span>
                          </div>
                        </div>

                        {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 3.4: Playback Speed & Pitch Sliders */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>Playback Rate & Baritone Pitch Sliders</span>
                </h4>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Speech Rate (Speed)</span>
                    <span className="font-mono font-bold text-indigo-600">{localVoiceSettings.rate}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.75"
                    max="1.35"
                    step="0.05"
                    value={localVoiceSettings.rate}
                    onChange={(e) =>
                      setLocalVoiceSettings((prev) => ({
                        ...prev,
                        rate: parseFloat(e.target.value)
                      }))
                    }
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    {speedPresets.map((sp) => (
                      <button
                        key={sp.value}
                        type="button"
                        onClick={() =>
                          setLocalVoiceSettings((prev) => ({
                            ...prev,
                            rate: sp.value
                          }))
                        }
                        className={`hover:text-indigo-600 cursor-pointer ${
                          localVoiceSettings.rate === sp.value ? 'text-indigo-600 font-bold' : ''
                        }`}
                      >
                        {sp.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Baritone Pitch (Tone Depth)</span>
                    <span className="font-mono font-bold text-indigo-600">
                      {localVoiceSettings.pitch}x {localVoiceSettings.pitch < 0.9 ? '(Deep Baritone)' : ''}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.70"
                    max="1.20"
                    step="0.02"
                    value={localVoiceSettings.pitch}
                    onChange={(e) =>
                      setLocalVoiceSettings((prev) => ({
                        ...prev,
                        pitch: parseFloat(e.target.value)
                      }))
                    }
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    {pitchPresets.map((pp) => (
                      <button
                        key={pp.value}
                        type="button"
                        onClick={() =>
                          setLocalVoiceSettings((prev) => ({
                            ...prev,
                            pitch: pp.value
                          }))
                        }
                        className={`hover:text-indigo-600 cursor-pointer ${
                          localVoiceSettings.pitch === pp.value ? 'text-indigo-600 font-bold' : ''
                        }`}
                      >
                        {pp.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 3.5: Test Voice & Reset */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestVoice}
                    disabled={isTestingVoice}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <PlayCircle className={`w-4 h-4 ${isTestingVoice ? 'animate-spin' : ''}`} />
                    <span>{isTestingVoice ? 'Speaking Sample...' : 'Test Voice Greeting'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('trigger-jarvis'));
                      }, 200);
                    }}
                    className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-mono font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Test "Hey Jarvis"</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setLocalVoiceSettings(DEFAULT_VOICE_SETTINGS)}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-mono transition flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Defaults</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {savedSuccessMessage ? (
            <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-600 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>{savedSuccessMessage}</span>
            </div>
          ) : (
            <span className="text-xs text-slate-500 font-mono">
              All settings are saved locally to your device
            </span>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save & Apply Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
