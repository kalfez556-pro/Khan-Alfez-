import React, { useState } from 'react';
import { UserProfile, Role, Division } from '../../types';
import { playSuccessChime, playWarningBuzzer } from '../../utils/audio';
import { triggerGrandCelebration, triggerQuickSparkle } from '../../utils/confetti';
import { IMAGES_2D, handleImageError, PUBLIC_IMAGES } from '../../assets/images';
import { AppIcon } from '../AppIcon';
import {
  Sparkles,
  Users,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  LogIn,
  UserPlus,
  QrCode,
  FileText,
  BookOpen,
  Trophy,
  CheckCircle2,
  Lock,
  Mail,
  User,
  Zap,
  Box,
  Phone,
  ShieldAlert
} from 'lucide-react';

interface WelcomeAuthProps {
  allUsers: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  onRegisterUser: (newUser: UserProfile) => void;
}

export const WelcomeAuthPortal: React.FC<WelcomeAuthProps> = ({
  allUsers,
  onSelectUser,
  onRegisterUser
}) => {
  const [authMode, setAuthMode] = useState<'demo' | 'login' | 'register'>('demo');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<Role>('student');
  const [regDivision, setRegDivision] = useState<Division>('A');
  const [regDepartment, setRegDepartment] = useState('Computer Science & Engineering');
  const [customDepartment, setCustomDepartment] = useState('');
  const [regRollNumber, setRegRollNumber] = useState('');
  const [regParentPhone, setRegParentPhone] = useState('');
  const [regPhoneError, setRegPhoneError] = useState<string | null>(null);

  // Demo user select
  const handleQuickLogin = (user: UserProfile) => {
    playSuccessChime();
    triggerGrandCelebration(2000);
    onSelectUser(user);
  };

  // Handle standard login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const user = allUsers.find(
      (u) =>
        u.email.toLowerCase() === loginEmail.toLowerCase().trim() ||
        (u.rollNumber && u.rollNumber.toLowerCase() === loginEmail.toLowerCase().trim())
    );

    if (user) {
      playSuccessChime();
      triggerGrandCelebration(2000);
      onSelectUser(user);
    } else {
      // If entered demo credentials or any email, log into Rahul Sharma or Arvind Sharma
      playWarningBuzzer();
      setLoginError('Email or ID not found. Use 1-Tap Quick Select below or check email address.');
    }
  };

  const getStudentDegreeTitle = (dept: string) => {
    const d = dept.toLowerCase();
    if (d.includes('pharmacy') || d.includes('pharm')) return `Pharmacy Student (${dept})`;
    if (d.includes('law') || d.includes('ll.b')) return `Law Student (${dept})`;
    if (d.includes('architecture') || d.includes('b.arch') || d.includes('design')) return `Architecture & Design Student (${dept})`;
    if (d.includes('nursing') || d.includes('medical')) return `Medical Sciences Student (${dept})`;
    if (d.includes('bba') || d.includes('mba') || d.includes('business')) return `Management Student (${dept})`;
    if (d.includes('commerce') || d.includes('b.com')) return `Commerce Student (${dept})`;
    if (d.includes('science') && !d.includes('computer') && !d.includes('data')) return `Science Student (${dept})`;
    if (d.includes('engineering') || d.includes('technology') || d.includes('telecommunication') || d.includes('aiml') || d.includes('artificial intelligence') || d.includes('machine learning') || d.includes('ai &')) {
      return `B.Tech Student (${dept})`;
    }
    return `Student (${dept})`;
  };

  const getRollPlaceholder = (dept: string) => {
    const d = dept.toLowerCase();
    if (d.includes('pharmacy') || d.includes('pharm')) return 'e.g. PH2024-105';
    if (d.includes('law') || d.includes('ll.b')) return 'e.g. LW2024-105';
    if (d.includes('architecture') || d.includes('b.arch')) return 'e.g. AR2024-105';
    if (d.includes('bba') || d.includes('mba') || d.includes('business')) return 'e.g. MG2024-105';
    if (d.includes('aiml') || d.includes('artificial intelligence') || d.includes('machine learning')) return 'e.g. AI2024-105';
    return 'e.g. CS2024-105';
  };

  // Handle custom registration
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalDepartment =
      regDepartment === 'Other' ? customDepartment.trim() : regDepartment;
    if (!regName.trim() || !regEmail.trim() || !finalDepartment) return;

    if (regRole === 'student') {
      const digitsOnly = regParentPhone.replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        setRegPhoneError('Please enter a valid 10-digit Parent / Guardian mobile number for Focus Lock OTP.');
        playWarningBuzzer();
        return;
      }
    }
    setRegPhoneError(null);

    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      name: regName.trim(),
      role: regRole,
      division: regRole === 'student' ? regDivision : 'A',
      department: finalDepartment,
      avatar: regRole === 'faculty'
        ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
        : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      title: regRole === 'faculty' ? `Assistant Professor (${finalDepartment})` : getStudentDegreeTitle(finalDepartment),
      email: regEmail.trim(),
      rollNumber: regRole === 'student' ? regRollNumber.trim() : undefined,
      parentPhone: regRole === 'student' ? regParentPhone.trim() : undefined,
      attendancePercent: regRole === 'student' ? 88.0 : 100,
      gems: 100, // Welcome gift of 100 gems!
      streakDays: 1,
      hasStreakFreeze: true,
      activeBadges: ['Welcome Scholar']
    };

    onRegisterUser(newUser);
    playSuccessChime();
    triggerGrandCelebration(2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      <div className="max-w-4xl w-full z-10 space-y-6 my-auto">
        {/* Clean Light Hero Banner */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-200 bg-white p-6 sm:p-7 shadow-sm">
          <div className="relative z-10 space-y-3 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-2.5 max-w-xl">
              <div className="flex items-center justify-center sm:justify-start gap-2.5">
                <AppIcon className="w-10 h-10 rounded-xl shadow-xs shrink-0" />
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono font-bold">
                  <span>Study Phantom • Smart Academic Platform</span>
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                Hello Faculty & Students! 👋
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Welcome to Study Phantom! Enter with one tap or register your account to experience dynamic QR attendance, online Google Classroom lab workstations, and live gem rankings.
              </p>
            </div>

            {/* 2D Vector Asset Showcase */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-200 shadow-xs transform hover:scale-105 transition bg-slate-50" title="QR Attendance">
                <img
                  src={IMAGES_2D.qrProjector}
                  alt="QR Scanner"
                  className="w-full h-full object-cover"
                  onError={(e) => handleImageError(e, PUBLIC_IMAGES.qrProjector)}
                />
              </div>
              <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-200 shadow-xs transform hover:scale-105 transition bg-slate-50" title="Classroom Vault">
                <img
                  src={IMAGES_2D.classroomVault}
                  alt="Classroom Vault"
                  className="w-full h-full object-cover"
                  onError={(e) => handleImageError(e, PUBLIC_IMAGES.classroomVault)}
                />
              </div>
              <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-200 shadow-xs transform hover:scale-105 transition bg-slate-50" title="Trophy & Gems">
                <img
                  src={IMAGES_2D.trophyGems}
                  alt="Trophy & Gems"
                  className="w-full h-full object-cover"
                  onError={(e) => handleImageError(e, PUBLIC_IMAGES.trophyGems)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Controls: Quick 1-Tap Select / Sign In / Register */}
        <div className="flex items-center justify-center">
          <div className="bg-white border border-slate-200 p-1 rounded-2xl flex gap-1 shadow-xs">
            <button
              onClick={() => setAuthMode('demo')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                authMode === 'demo'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>1-Tap Profiles (Demo)</span>
            </button>
            <button
              onClick={() => setAuthMode('login')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                authMode === 'login'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Student / Faculty Login</span>
            </button>
            <button
              onClick={() => setAuthMode('register')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                authMode === 'register'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register New Account</span>
            </button>
          </div>
        </div>

        {/* MODE 1: SQUARE-TYPE PHOTO BOXES FOR DEMO PROFILES */}
        {authMode === 'demo' && (
          <div className="space-y-4 animate-in fade-in zoom-in-95">
            <div className="text-center">
              <span className="text-xs font-mono uppercase font-bold text-slate-500 tracking-wider">
                Click any square box to immediately log in and enter the app:
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {allUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleQuickLogin(user)}
                  className="aspect-square rounded-3xl p-5 bg-white border border-slate-200 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all duration-300 flex flex-col justify-between relative overflow-hidden group shadow-xs hover:-translate-y-0.5"
                >
                  {/* Photo background with clean gradient overlay */}
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-25 group-hover:opacity-35"
                    onError={(e) => {
                      e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23dbeafe"/><text x="50%" y="55%" font-family="sans-serif" font-size="64" font-weight="bold" fill="%231d4ed8" dominant-baseline="middle" text-anchor="middle">${encodeURIComponent(user.name.charAt(0))}</text></svg>`;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/85 to-white/40" />

                  {/* Top Header Badge */}
                  <div className="relative z-10 flex items-start justify-between">
                    <span
                      className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded shadow-xs ${
                        user.role === 'faculty'
                          ? 'bg-slate-100 text-slate-800 border border-slate-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {user.role === 'faculty' ? 'Faculty' : `Division ${user.division}`}
                    </span>
                    <span className="text-[11px] font-mono text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shadow-xs">
                      💎 {user.gems}
                    </span>
                  </div>

                  {/* Bottom User Info */}
                  <div className="relative z-10">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition leading-snug">
                      {user.name}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5 font-medium line-clamp-1">
                      {user.role === 'student' ? user.rollNumber : user.title.split('(')[0]}
                    </p>
                    <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs text-blue-600 font-semibold">
                      <span>Click to Enter</span>
                      <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODE 2: STANDARD LOGIN FORM */}
        {authMode === 'login' && (
          <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm animate-in fade-in zoom-in-95">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2 border border-blue-100">
                <LogIn className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Sign In to Study Phantom</h2>
              <p className="text-xs text-slate-500 mt-1">Enter college email or student roll number</p>
            </div>

            {loginError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                  Email or Roll Number
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. rahul.s@student.engg.edu or CS2024-042"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In & Open Dashboard</span>
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <span className="text-xs text-slate-500">Want quick 1-click access? </span>
              <button
                onClick={() => setAuthMode('demo')}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                Use 1-Tap Profiles
              </button>
            </div>
          </div>
        )}

        {/* MODE 3: REGISTRATION FORM */}
        {authMode === 'register' && (
          <div className="max-w-lg mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl animate-in fade-in zoom-in-95">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2 border border-indigo-100">
                <UserPlus className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Create New College Account</h2>
              <p className="text-xs text-slate-500 mt-1">Register as Student or Faculty across Engineering, Pharmacy, Law, Architecture & more</p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Role Toggle */}
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                  I am registering as:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole('student')}
                    className={`py-2 rounded-xl text-xs font-bold transition ${
                      regRole === 'student'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    College Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole('faculty')}
                    className={`py-2 rounded-xl text-xs font-bold transition ${
                      regRole === 'faculty'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    College Faculty
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ankit Sharma"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                    College Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="ankit@student.edu"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                  />
                </div>
              </div>

              {regRole === 'student' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                      Assigned Division
                    </label>
                    <div className="flex gap-2">
                      {(['A', 'B'] as Division[]).map((div) => (
                        <button
                          key={div}
                          type="button"
                          onClick={() => setRegDivision(div)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                            regDivision === div
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          Division {div}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                      Roll Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={getRollPlaceholder(regDepartment)}
                      value={regRollNumber}
                      onChange={(e) => setRegRollNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                    />
                  </div>
                </div>
              )}

              {regRole === 'student' && (
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-600 flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-blue-600" />
                      <span>Parent / Guardian Mobile Number</span>
                    </span>
                    <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      Focus Lock 4-Digit OTP
                    </span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={regParentPhone}
                    onChange={(e) => {
                      setRegParentPhone(e.target.value);
                      if (regPhoneError) setRegPhoneError(null);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Ultimate Focus Mode me distraction apps (Insta/FB/Snap) unlock karne ka 4-digit OTP isi parent number par aayega.
                  </p>
                  {regPhoneError && (
                    <div className="mt-1.5 text-[11px] text-rose-600 font-medium flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      <span>{regPhoneError}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2.5">
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                    Branch / Department
                  </label>
                  <select
                    value={regDepartment}
                    onChange={(e) => setRegDepartment(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                  >
                    <optgroup label="Engineering & Technology">
                      <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                      <option value="AI & Machine Learning (AIML)">AI & Machine Learning (AIML)</option>
                      <option value="Artificial Intelligence & Data Science">AI & Data Science</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Electronics & Telecommunication">Electronics & Telecommunication</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                      <option value="Electrical Engineering">Electrical Engineering</option>
                    </optgroup>
                    <optgroup label="Pharmacy & Medical Sciences">
                      <option value="Pharmacy (B.Pharm)">Pharmacy (B.Pharm)</option>
                      <option value="Diploma in Pharmacy (D.Pharm)">Diploma in Pharmacy (D.Pharm)</option>
                      <option value="Pharmaceutics (M.Pharm / Pharm.D)">Pharmaceutics (M.Pharm / Pharm.D)</option>
                      <option value="Nursing & Allied Health Sciences">Nursing & Allied Health Sciences</option>
                    </optgroup>
                    <optgroup label="Law & Legal Studies">
                      <option value="Law (LL.B / BA LL.B)">Law (LL.B / BA LL.B)</option>
                      <option value="Corporate & Constitutional Law (BBA LL.B / LL.M)">Corporate & Constitutional Law (BBA LL.B / LL.M)</option>
                    </optgroup>
                    <optgroup label="Architecture & Design">
                      <option value="Architecture (B.Arch)">Architecture (B.Arch)</option>
                      <option value="Interior & Urban Design (B.Des)">Interior & Urban Design (B.Des)</option>
                    </optgroup>
                    <optgroup label="Management, Commerce & Sciences">
                      <option value="Business Administration (BBA / MBA)">Business Administration (BBA / MBA)</option>
                      <option value="Commerce & Finance (B.Com)">Commerce & Finance (B.Com)</option>
                      <option value="Applied Sciences (B.Sc / M.Sc)">Applied Sciences (B.Sc / M.Sc)</option>
                    </optgroup>
                    <optgroup label="Other Stream">
                      <option value="Other">Other (Enter Custom Branch)</option>
                    </optgroup>
                  </select>
                </div>

                {regDepartment === 'Other' && (
                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                      Specify Your Branch / Course
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Biotechnology, Journalism, Psychology"
                      value={customDepartment}
                      onChange={(e) => setCustomDepartment(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                  Create Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>Register & Claim +100 Starter Gems</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
