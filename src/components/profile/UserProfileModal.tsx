import React, { useState, useRef } from 'react';
import { UserProfile } from '../../types';
import {
  User,
  Mail,
  Camera,
  IdCard,
  Building,
  GraduationCap,
  Sparkles,
  Flame,
  ShieldCheck,
  Check,
  X,
  Upload,
  Link as LinkIcon,
  Eye,
  Lock,
  Layers,
  Award,
  Phone
} from 'lucide-react';
import { playSuccessChime, playWarningBuzzer } from '../../utils/audio';
import { triggerQuickSparkle } from '../../utils/confetti';

interface UserProfileModalProps {
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProfile: (updatedUser: UserProfile) => void;
}

// Curated high-resolution academic avatar presets
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
      { name: 'Algorithms Lead', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80' },
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

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onUpdateProfile
}) => {
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [rollNumber, setRollNumber] = useState(currentUser.rollNumber || '');
  const [title, setTitle] = useState(currentUser.title);
  const [department, setDepartment] = useState(currentUser.department);
  const [division, setDivision] = useState<'A' | 'B'>(currentUser.division || 'A');
  const [parentPhone, setParentPhone] = useState(currentUser.parentPhone || '');
  const [avatar, setAvatar] = useState(currentUser.avatar);

  // Custom photo URL input & upload state
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle local image file upload (FileReader converts to base64)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select a valid image file (JPEG, PNG, WEBP).');
      playWarningBuzzer();
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image size exceeds 5MB limit. Please choose a smaller photo.');
      playWarningBuzzer();
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatar(event.target.result as string);
        triggerQuickSparkle();
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle custom photo URL apply
  const handleApplyCustomUrl = () => {
    if (!customPhotoUrl.trim()) return;
    setAvatar(customPhotoUrl.trim());
    setCustomPhotoUrl('');
    setShowUrlInput(false);
    triggerQuickSparkle();
  };

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      playWarningBuzzer();
      return;
    }

    const updatedUser: UserProfile = {
      ...currentUser,
      name: name.trim(),
      email: email.trim(),
      avatar: avatar.trim(),
      division,
      department: department.trim(),
      title:
        currentUser.role === 'faculty'
          ? title.trim()
          : `${department.trim() || 'Academic'} Student (Div ${division})`,
      rollNumber: currentUser.role === 'student' ? rollNumber.trim() : undefined,
      parentPhone: currentUser.role === 'student' ? parentPhone.trim() || undefined : undefined
    };

    onUpdateProfile(updatedUser);
    playSuccessChime();
    triggerQuickSparkle();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden animate-in zoom-in-95 my-8">
        {/* Modal Top Header with Privacy Banner */}
        <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
                <IdCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>Personal Profile Settings</span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700 font-bold">
                    {currentUser.role === 'faculty' ? 'Faculty Menu' : 'Student Menu'}
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Manage your personal name, photo, email, and academic credentials
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Privacy Note: Only you see your email; others see only Name & Roll No */}
          <div className="mt-4 p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold text-emerald-400">Privacy Protection:</span> Only you can see and edit your personal email address here. Other students and faculty only see your public <span className="text-white font-semibold">Name</span> and <span className="text-white font-semibold">Roll Number</span> across leaderboards and classrooms.
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* SECTION 1: PHOTO / AVATAR CUSTOMIZER */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-indigo-400" />
                <span>Profile Photo & Avatar</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Click any preset or upload photo
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Active Photo Preview */}
              <div className="relative group shrink-0">
                <img
                  src={avatar}
                  alt={name}
                  className="w-20 h-20 rounded-2xl object-cover ring-2 ring-indigo-500 shadow-lg shadow-indigo-600/20"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-slate-950/70 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition cursor-pointer text-[10px] font-bold"
                >
                  <Upload className="w-4 h-4 mb-0.5 text-indigo-400" />
                  <span>Upload</span>
                </button>
              </div>

              {/* Photo Actions: Upload local photo or URL */}
              <div className="flex-1 w-full space-y-2">
                <div className="flex flex-wrap items-center gap-2">
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
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 font-semibold flex items-center gap-1.5 transition"
                  >
                    <Upload className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Upload from Device</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 font-semibold flex items-center gap-1.5 transition"
                  >
                    <LinkIcon className="w-3.5 h-3.5 text-sky-400" />
                    <span>Paste Image URL</span>
                  </button>
                </div>

                {showUrlInput && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="url"
                      value={customPhotoUrl}
                      onChange={(e) => setCustomPhotoUrl(e.target.value)}
                      placeholder="https://example.com/my-photo.jpg"
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:border-indigo-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCustomUrl}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                    >
                      Set
                    </button>
                  </div>
                )}

                {photoError && (
                  <p className="text-[11px] text-rose-400 font-medium">{photoError}</p>
                )}
              </div>
            </div>

            {/* Presets Gallery */}
            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-[11px] text-slate-400 block mb-2 font-mono">
                Or select from college avatars:
              </span>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {(currentUser.role === 'faculty' ? PRESET_AVATARS[1].avatars : PRESET_AVATARS[0].avatars).map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setAvatar(preset.url);
                      triggerQuickSparkle();
                    }}
                    title={preset.name}
                    className={`relative rounded-xl overflow-hidden aspect-square border transition transform hover:scale-105 ${
                      avatar === preset.url
                        ? 'border-indigo-500 ring-2 ring-indigo-400'
                        : 'border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                    {avatar === preset.url && (
                      <div className="absolute inset-0 bg-indigo-600/40 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 2: EDITABLE IDENTITY DETAILS */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Full Name</span>
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:border-indigo-500 outline-none"
                />
                <p className="text-[10px] text-slate-400">
                  Public Name displayed to faculty, peers, and on the leaderboard.
                </p>
              </div>

              {/* Personal Email (Marked as Private) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                    <span>Personal Email</span>
                    <span className="text-rose-400">*</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                    Private to You
                  </span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rahul.s@student.engg.edu"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-indigo-500 outline-none"
                />
                <p className="text-[10px] text-slate-400">
                  Used for account login and official academic communications. Never shared publicly.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Roll Number (for students) OR Title (for faculty) */}
              {currentUser.role === 'student' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <IdCard className="w-3.5 h-3.5 text-sky-400" />
                    <span>Roll Number / Student ID</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. CS2024-042"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono font-bold uppercase focus:border-indigo-500 outline-none"
                  />
                  <p className="text-[10px] text-slate-400">
                    Official College Roll Number visible to faculty for attendance and grading.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
                    <span>Faculty Designation & Title</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. HOD & Professor (Algorithms)"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-indigo-500 outline-none"
                  />
                  <p className="text-[10px] text-slate-400">
                    Academic title displayed to students in classroom groups.
                  </p>
                </div>
              )}

              {/* Division */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>College Division</span>
                </label>
                <select
                  value={division}
                  onChange={(e) => setDivision(e.target.value as 'A' | 'B')}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-indigo-500 outline-none"
                >
                  <option value="A">Division A</option>
                  <option value="B">Division B</option>
                </select>
                <p className="text-[10px] text-slate-400">
                  Controls your anti-proxy QR attendance session division.
                </p>
              </div>
            </div>

            {/* Department */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>Department</span>
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Computer Science & Engineering"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-indigo-500 outline-none"
              />
            </div>

            {currentUser.role === 'student' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Parent / Guardian Mobile Number</span>
                  </span>
                  <span className="text-[10px] font-mono text-sky-300 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/60">
                    Focus Lock 4-Digit OTP
                  </span>
                </label>
                <input
                  type="tel"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-indigo-500 outline-none"
                />
                <p className="text-[10px] text-slate-400">
                  4-digit verification OTP for urgent unlock during Ultimate Focus Mode is sent to this number.
                </p>
              </div>
            )}
          </div>

          {/* SECTION 3: PERSONAL ACADEMIC STATS SNAPSHOT */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Personal Academic Stats Snapshot</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">Gems Balance</span>
                <span className="text-sm font-bold text-amber-300 flex items-center justify-center gap-1 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> {currentUser.gems}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">Current Streak</span>
                <span className="text-sm font-bold text-orange-400 flex items-center justify-center gap-1 mt-0.5">
                  <Flame className="w-3.5 h-3.5 text-orange-400" /> {currentUser.streakDays}d
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">Attendance</span>
                <span className="text-sm font-bold text-emerald-400 block mt-0.5">
                  {currentUser.attendancePercent}%
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">Streak Shield</span>
                <span className="text-xs font-bold text-sky-300 flex items-center justify-center gap-1 mt-1">
                  {currentUser.hasStreakFreeze ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Active</span>
                    </>
                  ) : (
                    <span className="text-slate-500">None</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition transform hover:scale-[1.02]"
            >
              <Check className="w-4 h-4" />
              <span>Save Profile Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
