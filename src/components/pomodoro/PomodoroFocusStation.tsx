import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../../types';
import { IMAGES_2D, handleImageError, PUBLIC_IMAGES } from '../../assets/images';
import { setAmbientSound, playTimerFinishBell, playSuccessChime, playWarningBuzzer } from '../../utils/audio';
import { triggerGrandCelebration, triggerQuickSparkle } from '../../utils/confetti';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  VolumeX,
  Flame,
  ShieldCheck,
  Headphones,
  CloudRain,
  Radio,
  Coffee,
  Sparkles,
  Sliders,
  Plus,
  Minus,
  Lock,
  Unlock,
  BellOff,
  Smartphone,
  Phone,
  KeyRound,
  AlertTriangle,
  Maximize2,
  CheckCircle2,
  X,
  Send,
  PhoneCall,
  PhoneOff
} from 'lucide-react';

interface UltimateFocusProps {
  currentUser: UserProfile;
  onUpdateUserGems: (userId: string, gems: number) => void;
  onIncrementStreak: (userId: string) => void;
  onUpdateProfile?: (updatedUser: UserProfile) => void;
  onFocusLockChange?: (locked: boolean) => void;
}

interface DistractionAppOption {
  id: string;
  name: string;
  category: string;
  badge: string;
}

const DISTRACTION_APPS: DistractionAppOption[] = [
  { id: 'instagram', name: 'Instagram', category: 'Reels, DMs & Push Alerts', badge: 'IG' },
  { id: 'facebook', name: 'Facebook', category: 'Feed & Messenger Alerts', badge: 'FB' },
  { id: 'snapchat', name: 'Snapchat', category: 'Snaps & Streak Alerts', badge: 'SC' },
  { id: 'youtube_shorts', name: 'YouTube Shorts', category: 'Shorts & Video Alerts', badge: 'YT' },
  { id: 'whatsapp', name: 'WhatsApp', category: 'Chats & Group Pings', badge: 'WA' },
  { id: 'gaming', name: 'Games & X', category: 'Social & Game Invites', badge: 'GM' }
];

export const PomodoroFocusStation: React.FC<UltimateFocusProps> = ({
  currentUser,
  onUpdateUserGems,
  onIncrementStreak,
  onUpdateProfile,
  onFocusLockChange
}) => {
  // Modes: 25 min focus, 5 min short break, 15 min long break, or custom user time
  const [mode, setMode] = useState<'focus' | 'short_break' | 'long_break' | 'custom'>('focus');
  const [customMinutes, setCustomMinutes] = useState<number>(45);
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [ambientTrack, setAmbientTrack] = useState<'none' | 'binaural' | 'rain' | 'whitenoise'>('none');
  const [ambientVolume, setAmbientVolume] = useState<number>(0.15);

  // Focus Task Log
  const [currentTask, setCurrentTask] = useState<string>('Compiler Design: LR(1) Parser Grammar Analysis');
  const [completedSessionsToday, setCompletedSessionsToday] = useState<number>(3);
  const [totalMinutesStudied, setTotalMinutesStudied] = useState<number>(75);

  // Distraction App & Notification Lock + Parental 4-Digit OTP State
  const [lockedApps, setLockedApps] = useState<string[]>(['instagram', 'facebook', 'snapchat']);
  const [strictParentLock, setStrictParentLock] = useState<boolean>(currentUser.role === 'student');
  const [isShieldUnlockedForSession, setIsShieldUnlockedForSession] = useState<boolean>(false);
  const [blockedAttempts, setBlockedAttempts] = useState<number>(0);
  const [lockAlerts, setLockAlerts] = useState<string[]>([]);
  const [inlineParentPhone, setInlineParentPhone] = useState<string>(currentUser.parentPhone || '');
  const [isEditingParentPhone, setIsEditingParentPhone] = useState<boolean>(false);
  const [parentPhoneSaveMsg, setParentPhoneSaveMsg] = useState<string | null>(null);

  // Parent OTP Verification Modal State
  const [isOtpModalOpen, setIsOtpModalOpen] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<'pause' | 'reset' | 'unlock_only' | 'short_break' | 'long_break'>('pause');
  const [urgentReason, setUrgentReason] = useState<string>('');
  const [otpId, setOtpId] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState<string>('');
  const [otpMaskedPhone, setOtpMaskedPhone] = useState<string>('');
  const [otpDeliveryInfo, setOtpDeliveryInfo] = useState<{ mode: string; previewOtp?: string; previewSms?: string } | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  // Phone Call Exception State (Only phone calls allowed during Focus Lock; timer freezes during call)
  const [isOnCall, setIsOnCall] = useState<boolean>(false);
  const [callSeconds, setCallSeconds] = useState<number>(0);
  const [returnedFromCallPrompt, setReturnedFromCallPrompt] = useState<boolean>(false);

  useEffect(() => {
    setInlineParentPhone(currentUser.parentPhone || '');
  }, [currentUser.parentPhone]);

  const isFocusSessionType = mode === 'focus' || mode === 'custom';
  const isFocusLocked =
    isRunning &&
    isFocusSessionType &&
    !isShieldUnlockedForSession &&
    (lockedApps.length > 0 || strictParentLock);

  const isParentOtpRequired = isFocusLocked && strictParentLock && currentUser.role === 'student';

  useEffect(() => {
    onFocusLockChange?.(isFocusLocked);
  }, [isFocusLocked, onFocusLockChange]);

  // Execute mode change cleanly
  const applyModeChange = useCallback((newMode: 'focus' | 'short_break' | 'long_break' | 'custom') => {
    setMode(newMode);
    setIsRunning(false);
    setIsShieldUnlockedForSession(false);
    setIsOnCall(false);
    setCallSeconds(0);
    setReturnedFromCallPrompt(false);
    if (newMode === 'focus') setTimeLeft(25 * 60);
    else if (newMode === 'short_break') setTimeLeft(5 * 60);
    else if (newMode === 'long_break') setTimeLeft(15 * 60);
    else setTimeLeft(customMinutes * 60);
  }, [customMinutes]);

  const openParentOtpModal = (action: 'pause' | 'reset' | 'unlock_only' | 'short_break' | 'long_break') => {
    setPendingAction(action);
    setOtpError(null);
    setOtpInput('');
    setOtpId(null);
    setOtpDeliveryInfo(null);
    setIsOtpModalOpen(true);
  };

  // Reset timer on mode change (guarded by Parent OTP when Focus Lock is active)
  const handleModeChange = (newMode: 'focus' | 'short_break' | 'long_break' | 'custom') => {
    if (isParentOtpRequired && newMode !== mode) {
      if (newMode === 'short_break' || newMode === 'long_break') {
        openParentOtpModal(newMode);
      } else {
        openParentOtpModal('reset');
      }
      return;
    }
    applyModeChange(newMode);
  };

  const toggleLockedApp = (appId: string) => {
    if (isFocusLocked) return;
    setLockedApps((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  };

  const handleSaveInlineParentPhone = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = inlineParentPhone.replace(/\D/g, '');
    if (digits.length < 10) {
      playWarningBuzzer();
      setParentPhoneSaveMsg('Enter a valid 10-digit parent mobile number.');
      return;
    }
    onUpdateProfile?.({ ...currentUser, parentPhone: inlineParentPhone.trim() });
    playSuccessChime();
    setIsEditingParentPhone(false);
    setParentPhoneSaveMsg('Parent mobile saved for 4-digit Focus OTP!');
    setTimeout(() => setParentPhoneSaveMsg(null), 3000);
  };

  const handleSendParentOtp = async () => {
    const targetPhone = (currentUser.parentPhone || inlineParentPhone).trim();
    if (targetPhone.replace(/\D/g, '').length < 10) {
      setOtpError('Please enter & save a valid 10-digit parent mobile number first.');
      playWarningBuzzer();
      return;
    }
    if (!currentUser.parentPhone && onUpdateProfile) {
      onUpdateProfile({ ...currentUser, parentPhone: targetPhone });
    }

    setIsSendingOtp(true);
    setOtpError(null);
    try {
      const selectedAppNames = DISTRACTION_APPS.filter((a) => lockedApps.includes(a.id)).map((a) => a.name);
      const res = await fetch('/api/focus/send-parent-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentPhone: targetPhone,
          studentName: currentUser.name,
          reason: urgentReason.trim() || 'Urgent work requested during Focus Lock',
          lockedApps: selectedAppNames
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not send OTP to parent mobile.');
      }
      setOtpId(data.otpId);
      setOtpMaskedPhone(data.maskedPhone || targetPhone);
      setOtpDeliveryInfo({
        mode: data.deliveryMode,
        previewOtp: data.previewOtp,
        previewSms: data.previewSms
      });
      setResendCooldown(30);
      playSuccessChime();
    } catch (err: any) {
      setOtpError(err?.message || 'Failed to send 4-digit OTP.');
      playWarningBuzzer();
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyParentOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpId) {
      setOtpError('First tap "Send 4-Digit OTP to Parent Mobile".');
      playWarningBuzzer();
      return;
    }
    if (otpInput.trim().length !== 4) {
      setOtpError('Please enter the exact 4-digit OTP code.');
      playWarningBuzzer();
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError(null);
    try {
      const res = await fetch('/api/focus/verify-parent-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otpId,
          code: otpInput.trim()
        })
      });
      const data = await res.json();
      if (!res.ok || !data.verified) {
        throw new Error(data.error || 'Incorrect 4-digit Parent OTP.');
      }

      playSuccessChime();
      triggerQuickSparkle();
      const timeStamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLockAlerts((prev) => [
        `${timeStamp} — Urgent unlock verified via Parent 4-digit OTP (${urgentReason.trim() || 'Emergency'})`,
        ...prev.slice(0, 4)
      ]);

      setIsOtpModalOpen(false);
      if (pendingAction === 'pause') {
        setIsShieldUnlockedForSession(true);
        setIsRunning(false);
      } else if (pendingAction === 'reset') {
        applyModeChange(mode);
      } else if (pendingAction === 'short_break' || pendingAction === 'long_break') {
        applyModeChange(pendingAction);
      } else {
        setIsShieldUnlockedForSession(true);
      }
    } catch (err: any) {
      setOtpError(err?.message || 'OTP verification failed.');
      playWarningBuzzer();
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleRequestFullscreenLock = () => {
    if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        // Ignore if browser restricts fullscreen
      });
    }
  };

  const handleStartPhoneCall = () => {
    if (!isRunning || isOnCall) return;
    setIsOnCall(true);
    setCallSeconds(0);
    setReturnedFromCallPrompt(false);
    setAmbientSound('none', 0);
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLockAlerts((prev) => [
      `${ts} — Phone Call started (Timer frozen at ${formatTime(timeLeft)}; Study Phantom waiting).`,
      ...prev.slice(0, 4)
    ]);
  };

  const handleEndPhoneCallAndResume = () => {
    if (!isOnCall) return;
    const durationText = formatTime(callSeconds);
    setIsOnCall(false);
    setCallSeconds(0);
    setReturnedFromCallPrompt(false);
    if (ambientTrack !== 'none') {
      setAmbientSound(ambientTrack, ambientVolume);
    }
    playSuccessChime();
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLockAlerts((prev) => [
      `${ts} — Returned from Call (${durationText}) • Focus timer resumed from ${formatTime(timeLeft)}.`,
      ...prev.slice(0, 4)
    ]);
  };

  // Adjust custom minutes
  const handleCustomMinutesChange = (newMinutes: number) => {
    const clamped = Math.max(1, Math.min(180, newMinutes));
    setCustomMinutes(clamped);
    if (mode === 'custom' && !isRunning) {
      setTimeLeft(clamped * 60);
    }
  };

  // Quick delta buttons (+5m, -5m)
  const adjustTimeDelta = (deltaMinutes: number) => {
    if (isRunning) return;
    const currentM = Math.floor(timeLeft / 60);
    const newMinutes = Math.max(1, Math.min(180, currentM + deltaMinutes));
    setTimeLeft(newMinutes * 60);
    if (mode === 'custom') {
      setCustomMinutes(newMinutes);
    }
  };

  // Calculate proportional gems reward based on duration
  const calculateRewardGems = () => {
    if (mode === 'short_break' || mode === 'long_break') return 0;
    const minutes = mode === 'focus' ? 25 : customMinutes;
    return Math.max(5, Math.round(minutes * 0.8));
  };

  // Timer Tick (freezes automatically while student is attending a phone call!)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRunning && !isOnCall) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer Finished!
            playTimerFinishBell();
            setIsRunning(false);
            setIsOnCall(false);
            setIsShieldUnlockedForSession(false);
            if (mode === 'focus' || mode === 'custom') {
              triggerGrandCelebration(2500);
              const sessionMins = mode === 'focus' ? 25 : customMinutes;
              const earnedGems = calculateRewardGems();
              setCompletedSessionsToday((c) => c + 1);
              setTotalMinutesStudied((m) => m + sessionMins);
              onUpdateUserGems(currentUser.id, earnedGems);
              onIncrementStreak(currentUser.id);
            } else {
              triggerQuickSparkle();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isOnCall, mode, customMinutes, currentUser.id, onUpdateUserGems, onIncrementStreak]);

  // Phone Call stopwatch while Focus Timer is frozen
  useEffect(() => {
    if (!isOnCall) return;
    const callTimer = setInterval(() => {
      setCallSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(callTimer);
  }, [isOnCall]);

  // Ambient Sound Sync
  const handleAmbientChange = (track: 'none' | 'binaural' | 'rain' | 'whitenoise') => {
    setAmbientTrack(track);
    setAmbientSound(track, ambientVolume);
  };

  const handleVolumeChange = (newVol: number) => {
    setAmbientVolume(newVol);
    if (ambientTrack !== 'none') {
      setAmbientSound(ambientTrack, newVol);
    }
  };

  // Stop ambient on unmount
  useEffect(() => {
    return () => {
      setAmbientSound('none', 0);
    };
  }, []);

  // Resend OTP 30s countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Monitor distraction tab-switch attempts & returning from phone call while Focus Lock is active
  useEffect(() => {
    if (!isFocusLocked) return;
    const handleVisibilityChange = () => {
      if (isOnCall) {
        if (document.visibilityState === 'visible') {
          setReturnedFromCallPrompt(true);
          playSuccessChime();
        }
        return;
      }
      if (document.hidden) {
        playWarningBuzzer();
        setBlockedAttempts((n) => n + 1);
        const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLockAlerts((prev) => [
          `${ts} — App exit / tab switch blocked! Only phone calls allowed during Focus Lock.`,
          ...prev.slice(0, 4)
        ]);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isFocusLocked, isOnCall]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalDuration =
    mode === 'focus'
      ? 25 * 60
      : mode === 'short_break'
      ? 5 * 60
      : mode === 'long_break'
      ? 15 * 60
      : customMinutes * 60;

  const quickPresets = [15, 30, 45, 60, 90, 120];

  return (
    <div className="space-y-6">
      {/* Station Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400">
              <Timer className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Ultimate Focus Mode & Binaural Synthesizer
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Customizable deep work timer with self-set duration, Web Audio API 40Hz binaural focus soundscapes, streak tracking, and streak freeze perk shields.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* 2D Vector Focus Chronometer Orb Thumbnail */}
          <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-orange-500/50 shadow-lg shadow-orange-600/30 bg-slate-950 shrink-0 transform hover:scale-105 transition" title="2D Focus Chronometer Orb">
            <img
              src={IMAGES_2D.focusTimer}
              alt="Focus Chronometer 2D Vector"
              className="w-full h-full object-cover"
              onError={(e) => handleImageError(e, PUBLIC_IMAGES.focusTimer)}
            />
          </div>

          {/* Streak Protection Status Badge */}
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-orange-950/40 border border-orange-600/40 text-orange-300">
            <Flame className="w-5 h-5 text-orange-400 animate-bounce" />
            <div>
              <div className="text-xs font-bold font-mono">
                {currentUser.streakDays}-Day Learning Streak
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                {currentUser.hasStreakFreeze ? (
                  <span className="flex items-center gap-1 text-emerald-400" title="Streak Freeze Active">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> Streak Freeze Active (Shielded)
                  </span>
                ) : (
                  'Standard Protection'
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Clock Dial Box */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col items-center justify-center relative overflow-hidden">
          {/* Mode Switcher Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl mb-6">
            <button
              onClick={() => handleModeChange('focus')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                mode === 'focus'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              25m Focus Block
            </button>
            <button
              onClick={() => handleModeChange('short_break')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                mode === 'short_break'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              5m Short Rest
            </button>
            <button
              onClick={() => handleModeChange('long_break')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                mode === 'long_break'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              15m Long Break
            </button>
            <button
              onClick={() => handleModeChange('custom')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                mode === 'custom'
                  ? 'bg-gradient-to-r from-indigo-600 to-sky-500 text-white shadow-md'
                  : 'text-indigo-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Custom Time (Self Set)</span>
            </button>
          </div>

          {/* CUSTOM TIME CONTROLS (Appears when Custom is selected or for quick adjustment) */}
          {mode === 'custom' && (
            <div className="w-full max-w-md bg-slate-950/80 border border-indigo-500/30 rounded-xl p-3.5 mb-6 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase text-indigo-300 font-mono flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  Set Your Custom Duration:
                </span>
                <span className="text-xs font-bold font-mono text-white bg-indigo-950 px-2 py-0.5 rounded border border-indigo-700">
                  {customMinutes} Minutes ({Math.round(customMinutes * 60)}s)
                </span>
              </div>

              {/* Slider */}
              <input
                type="range"
                min="1"
                max="120"
                step="1"
                value={customMinutes}
                disabled={isRunning}
                onChange={(e) => handleCustomMinutesChange(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-500 cursor-pointer"
              />

              {/* Quick Presets */}
              <div className="flex items-center gap-1 mt-2.5 overflow-x-auto pb-1">
                <span className="text-[10px] text-slate-500 font-mono uppercase mr-1">Presets:</span>
                {quickPresets.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    disabled={isRunning}
                    onClick={() => handleCustomMinutesChange(mins)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition ${
                      customMinutes === mins
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Circular Countdown Display with 3D Holographic Chronometer Texture */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border-4 border-slate-800 flex flex-col items-center justify-center bg-slate-950 shadow-2xl overflow-hidden">
            {/* 2D Chronometer Vector Background */}
            <div className="absolute inset-0 z-0 opacity-25 filter saturate-150">
              <img
                src={IMAGES_2D.focusTimer}
                alt="Focus Chronometer Vector"
                className="w-full h-full object-cover"
                onError={(e) => handleImageError(e, PUBLIC_IMAGES.focusTimer)}
              />
              <div className="absolute inset-0 bg-slate-950/60" />
            </div>

            {/* Active ring highlight */}
            <div
              className={`absolute inset-0 rounded-full border-4 transition-all duration-500 pointer-events-none ${
                isRunning
                  ? mode === 'focus' || mode === 'custom'
                    ? 'border-orange-500'
                    : 'border-emerald-500'
                  : 'border-transparent'
              }`}
            />

            <div className="relative z-10 text-5xl sm:text-6xl font-black font-mono tracking-tight text-white select-none">
              {formatTime(timeLeft)}
            </div>

            <div className="relative z-10 text-xs font-mono uppercase tracking-widest text-slate-300 mt-2 font-bold">
              {mode === 'custom'
                ? `Custom Focus (${customMinutes}m)`
                : mode === 'focus'
                ? 'Deep Work Session'
                : 'Recharge Break'}
            </div>

            {(mode === 'focus' || mode === 'custom') && (
              <span className="relative z-10 text-[10px] text-amber-300 font-mono mt-1 flex items-center gap-1 font-bold">
                <Sparkles className="w-3 h-3 text-amber-400" /> +{calculateRewardGems()} Gems on completion
              </span>
            )}
          </div>

          {/* Time Fine-Tuning Step Controls (-5m / +5m) */}
          {!isRunning && (
            <div className="flex items-center gap-2 mt-4 text-xs font-mono">
              <button
                onClick={() => adjustTimeDelta(-5)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 transition"
                title="Subtract 5 minutes"
              >
                <Minus className="w-3 h-3" /> 5m
              </button>
              <span className="text-[11px] text-slate-500">Fine Tune Duration</span>
              <button
                onClick={() => adjustTimeDelta(5)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 transition"
                title="Add 5 minutes"
              >
                <Plus className="w-3 h-3" /> 5m
              </button>
            </div>
          )}

          {/* Active Focus Shield Banner / Phone Call Exception Card */}
          {isFocusLocked && isOnCall && (
            <div className="w-full max-w-md mt-4 mb-2 p-4 rounded-2xl bg-sky-950/70 border border-sky-500/60 text-left space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-sky-200 flex items-center gap-1.5">
                  <PhoneCall className="w-4 h-4 text-sky-400 animate-pulse" />
                  <span>
                    {returnedFromCallPrompt
                      ? 'Welcome Back! Call Ended?'
                      : 'Phone Call Active — Focus Timer Stopped'}
                  </span>
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-900 text-sky-100 border border-sky-700 font-bold">
                  Call: {formatTime(callSeconds)}
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                Aapka Focus Timer <strong className="text-white font-mono">{formatTime(timeLeft)}</strong> par ruka hua hai jab tak call chal rahi hai. Instagram, Facebook & Snapchat abhi bhi locked hain.
              </p>

              <button
                type="button"
                onClick={handleEndPhoneCallAndResume}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                <PhoneOff className="w-4 h-4" />
                <span>Call Ended • Resume Focus Timer ({formatTime(timeLeft)})</span>
              </button>
            </div>
          )}

          {isFocusLocked && !isOnCall && (
            <div className="w-full max-w-md mt-4 mb-2 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-left space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-rose-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                  <span>Study Phantom Exit Locked ({formatTime(timeLeft)})</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-900 text-rose-200 border border-rose-700 font-bold">
                  NO QUIT • CALLS OK
                </span>
              </div>
              <p className="text-[11px] text-rose-100/90 leading-snug">
                App quit, logout aur baaki apps locked hain. Sirf phone call attend kar sakte hain (call ke dauran timer stop ho jayega).
              </p>
              <div className="flex flex-wrap gap-1.5">
                {DISTRACTION_APPS.filter((app) => lockedApps.includes(app.id)).map((app) => (
                  <span
                    key={app.id}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-950/90 border border-rose-700/60 text-rose-200 flex items-center gap-1"
                  >
                    <BellOff className="w-2.5 h-2.5 text-rose-400" />
                    {app.name} Locked
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between pt-1 text-[10px] text-slate-300 font-mono">
                <span>Blocked exit/switch attempts: {blockedAttempts}</span>
                <button
                  type="button"
                  onClick={handleRequestFullscreenLock}
                  className="text-sky-300 hover:text-sky-200 underline flex items-center gap-1 cursor-pointer"
                >
                  <Maximize2 className="w-3 h-3" /> Fullscreen Lock
                </button>
              </div>
            </div>
          )}

          {/* Primary Action Controls */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button
              onClick={() => {
                if (isRunning) {
                  if (isParentOtpRequired) {
                    openParentOtpModal('pause');
                    return;
                  }
                  setIsRunning(false);
                } else {
                  setIsShieldUnlockedForSession(false);
                  setIsOnCall(false);
                  setIsRunning(true);
                  if (ambientTrack === 'none') {
                    handleAmbientChange('binaural');
                  }
                }
              }}
              className={`px-7 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-xl transition cursor-pointer ${
                isRunning
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/40'
              }`}
            >
              {isRunning ? (
                isParentOtpRequired ? <Lock className="w-4 h-4" /> : <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              <span>
                {isRunning
                  ? isParentOtpRequired
                    ? 'Pause (Parent OTP)'
                    : 'Pause Ultimate Focus'
                  : 'Launch Ultimate Focus'}
              </span>
            </button>

            <button
              onClick={() => handleModeChange(mode)}
              title="Reset Timer"
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {isFocusLocked && !isOnCall && (
              <button
                type="button"
                onClick={handleStartPhoneCall}
                className="px-4 py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg transition cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Attend Phone Call (Stops Timer)</span>
              </button>
            )}

            {isParentOtpRequired && (
              <button
                type="button"
                onClick={() => openParentOtpModal('unlock_only')}
                className="px-4 py-3 rounded-2xl bg-amber-600/90 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg transition cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>Urgent Unlock (Parent OTP)</span>
              </button>
            )}
          </div>

          {/* Active task description */}
          <div className="mt-6 w-full max-w-md">
            <label className="text-[10px] font-bold uppercase text-slate-400 font-mono block mb-1">
              Active Focus Target Goal:
            </label>
            <input
              type="text"
              value={currentTask}
              onChange={(e) => setCurrentTask(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-indigo-200 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Right Column: Web Audio Ambient Synthesizer & Daily Log */}
        <div className="lg:col-span-5 space-y-6">
          {/* Ambient Soundscape Synthesizer Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Headphones className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-white text-sm">
                  Ambient Study Sound Synthesizer
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                Web Audio Engine
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Synthesizes real-time soothing acoustic environments in your browser without external audio stream buffering.
            </p>

            {/* Ambient Selection Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleAmbientChange('binaural')}
                className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                  ambientTrack === 'binaural'
                    ? 'bg-indigo-950 border-indigo-500 text-indigo-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Radio className="w-4 h-4 text-indigo-400" />
                <div>
                  <div className="text-xs font-bold text-white">40Hz Binaural</div>
                  <div className="text-[10px] text-slate-400">Beta Gamma Focus</div>
                </div>
              </button>

              <button
                onClick={() => handleAmbientChange('rain')}
                className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                  ambientTrack === 'rain'
                    ? 'bg-sky-950 border-sky-500 text-sky-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <CloudRain className="w-4 h-4 text-sky-400" />
                <div>
                  <div className="text-xs font-bold text-white">Lofi Rain</div>
                  <div className="text-[10px] text-slate-400">Brownian Noise</div>
                </div>
              </button>

              <button
                onClick={() => handleAmbientChange('whitenoise')}
                className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                  ambientTrack === 'whitenoise'
                    ? 'bg-amber-950 border-amber-500 text-amber-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Coffee className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-xs font-bold text-white">Study Hum</div>
                  <div className="text-[10px] text-slate-400">Pink noise filter</div>
                </div>
              </button>

              <button
                onClick={() => handleAmbientChange('none')}
                className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                  ambientTrack === 'none'
                    ? 'bg-slate-800 border-slate-600 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <VolumeX className="w-4 h-4 text-slate-400" />
                <div>
                  <div className="text-xs font-bold text-white">Silent Focus</div>
                  <div className="text-[10px] text-slate-400">No background</div>
                </div>
              </button>
            </div>

            {/* Volume Slider */}
            {ambientTrack !== 'none' && (
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-mono">
                  <span>Synthesizer Volume:</span>
                  <span>{Math.round(ambientVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.02"
                  max="0.4"
                  step="0.02"
                  value={ambientVolume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Daily Study Log & Stats */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>Today's Study Session Log</span>
              <span className="text-xs font-mono text-indigo-400 font-semibold">
                {totalMinutesStudied} Mins Total
              </span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-mono uppercase text-slate-400">Completed Sessions</span>
                <div className="text-xl font-bold text-white mt-0.5">{completedSessionsToday} Blocks</div>
                <span className="text-[10px] text-emerald-400 font-mono">Goal: 4 Blocks</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-mono uppercase text-slate-400">Gems Earned Today</span>
                <div className="text-xl font-bold text-amber-400 mt-0.5">+{completedSessionsToday * 20}</div>
                <span className="text-[10px] text-amber-400/80 font-mono">From Focus Sessions</span>
              </div>
            </div>

            <div className="text-xs text-slate-400 p-3 bg-slate-950 rounded-xl border border-slate-800/80">
              <ShieldCheck className="w-4 h-4 text-emerald-400 inline mr-1" />
              Completing at least 1 Ultimate Focus session today preserves your {currentUser.streakDays}-day streak without using your Streak Freeze shield perk.
            </div>
          </div>

          {/* Distraction App & Notification Lock + Parental 4-Digit OTP Control */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BellOff className="w-4 h-4 text-rose-400" />
                <h3 className="font-bold text-white text-sm">
                  Distraction App & Notification Lock
                </h3>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                  isFocusLocked
                    ? 'bg-rose-950 text-rose-300 border-rose-700'
                    : 'bg-indigo-950 text-indigo-300 border-indigo-700'
                }`}
              >
                {isFocusLocked ? 'LOCKED NOW' : `${lockedApps.length} APPS SELECTED`}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Jab Ultimate Focus Time chalega, selected social apps aur unke notifications utni der ke liye lock rahenge. Urgent kaam ke liye Parent ke mobile par aaya 4-digit OTP verify karna hoga.
            </p>

            {/* Selectable Apps Grid */}
            <div className="grid grid-cols-2 gap-2">
              {DISTRACTION_APPS.map((app) => {
                const selected = lockedApps.includes(app.id);
                return (
                  <button
                    key={app.id}
                    type="button"
                    disabled={isFocusLocked}
                    onClick={() => toggleLockedApp(app.id)}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between gap-2 ${
                      selected
                        ? 'bg-rose-950/50 border-rose-500/60 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    } ${isFocusLocked ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold flex items-center gap-1.5 truncate">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200">
                          {app.badge}
                        </span>
                        <span className="truncate">{app.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">{app.category}</div>
                    </div>
                    {selected ? (
                      <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    ) : (
                      <Unlock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Strict Parent 4-Digit OTP Toggle & Parent Number Display */}
            {currentUser.role === 'student' && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      <span>Strict Parent 4-Digit OTP Guard</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Require 4-digit OTP from Parent Mobile to pause or unlock early
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isFocusLocked}
                    onClick={() => setStrictParentLock((v) => !v)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-mono font-bold transition ${
                      strictParentLock
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    } ${isFocusLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {strictParentLock ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* Registered Parent Mobile Number */}
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5 font-mono text-[11px]">
                      <Phone className="w-3.5 h-3.5 text-sky-400" />
                      <span>Parent Mobile:</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sky-300 text-xs">
                        {currentUser.parentPhone || 'Not Added Yet'}
                      </span>
                      {!isFocusLocked && (
                        <button
                          type="button"
                          onClick={() => setIsEditingParentPhone((v) => !v)}
                          className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                        >
                          {isEditingParentPhone ? 'Cancel' : currentUser.parentPhone ? 'Edit' : '+ Add Number'}
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditingParentPhone && !isFocusLocked && (
                    <form onSubmit={handleSaveInlineParentPhone} className="mt-2.5 flex items-center gap-2">
                      <input
                        type="tel"
                        required
                        value={inlineParentPhone}
                        onChange={(e) => setInlineParentPhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
                      >
                        Save
                      </button>
                    </form>
                  )}

                  {parentPhoneSaveMsg && (
                    <p className="text-[10px] text-emerald-400 font-mono mt-1.5">{parentPhoneSaveMsg}</p>
                  )}
                </div>
              </div>
            )}

            {/* Lock Shield Event Feed */}
            {lockAlerts.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                  Focus Shield Activity Log
                </div>
                {lockAlerts.map((msg, idx) => (
                  <div key={idx} className="text-[11px] text-slate-300 font-mono leading-snug">
                    • {msg}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PARENTAL 4-DIGIT OTP VERIFICATION MODAL */}
      {isOtpModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Parent 4-Digit OTP Required</h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Focus Shield Active • {formatTime(timeLeft)} remaining
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOtpModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-xs text-rose-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>
                  Instagram, Facebook, Snapchat & selected notifications are locked. Urgent kaam ke liye parent ke mobile par 4-digit verification code bhejein.
                </span>
              </div>

              {/* Parent Phone Verification Target */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-slate-300 block">
                  Parent Mobile Number (From Profile)
                </label>
                {currentUser.parentPhone ? (
                  <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-sky-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                      {currentUser.parentPhone}
                    </span>
                    <span className="text-[10px] text-emerald-400">Registered</span>
                  </div>
                ) : (
                  <input
                    type="tel"
                    value={inlineParentPhone}
                    onChange={(e) => setInlineParentPhone(e.target.value)}
                    placeholder="Enter Parent Mobile e.g. +91 98765 43210"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                )}
              </div>

              {/* Urgent Reason */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-slate-300 block">
                  Urgent Reason (Sent to Parent SMS)
                </label>
                <input
                  type="text"
                  value={urgentReason}
                  onChange={(e) => setUrgentReason(e.target.value)}
                  placeholder="e.g. Urgent family call or faculty message"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Send OTP Button */}
              <button
                type="button"
                disabled={isSendingOtp || resendCooldown > 0}
                onClick={handleSendParentOtp}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {isSendingOtp
                    ? 'Sending 4-Digit OTP...'
                    : resendCooldown > 0
                    ? `OTP Sent! Resend in ${resendCooldown}s`
                    : otpId
                    ? 'Resend 4-Digit OTP to Parent'
                    : 'Send 4-Digit Code to Parent Mobile'}
                </span>
              </button>

              {/* Parent Mobile SMS Delivery Status / Preview */}
              {otpDeliveryInfo && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-700/50 space-y-1.5">
                  <div className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      {otpDeliveryInfo.mode === 'twilio-sms'
                        ? `SMS sent to Parent Mobile (${otpMaskedPhone})`
                        : `Parent Mobile SMS Delivered (${otpMaskedPhone})`}
                    </span>
                  </div>
                  {otpDeliveryInfo.previewSms && (
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-200 leading-relaxed">
                      <div className="text-[10px] text-sky-400 mb-1 uppercase font-bold">
                        Parent Phone Inbox Preview:
                      </div>
                      {otpDeliveryInfo.previewSms}
                    </div>
                  )}
                </div>
              )}

              {/* 4-Digit Code Entry Form */}
              <form onSubmit={handleVerifyParentOtp} className="space-y-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-300 block mb-1.5">
                    Enter 4-Digit Parent Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="• • • •"
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-700 text-center text-xl font-mono font-black tracking-[0.5em] text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {otpError && (
                  <p className="text-xs text-rose-400 font-medium text-center">{otpError}</p>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOtpModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer"
                  >
                    Stay in Focus
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifyingOtp || otpInput.length !== 4}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer"
                  >
                    {isVerifyingOtp ? 'Verifying...' : 'Verify & Unlock'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
