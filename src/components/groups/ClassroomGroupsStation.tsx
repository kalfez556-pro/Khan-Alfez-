import React, { useState } from 'react';
import { UserProfile, ClassroomGroup } from '../../types';
import { IMAGES_2D, IMAGES_3D, handleImageError, PUBLIC_IMAGES } from '../../assets/images';
import {
  Users,
  KeyRound,
  Link as LinkIcon,
  Copy,
  Check,
  ShieldCheck,
  Plus,
  Eye,
  EyeOff,
  UserCheck,
  Sparkles,
  AlertTriangle,
  Send,
  BookOpen,
  FileText,
  QrCode,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  GraduationCap,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { playSuccessChime, playWarningBuzzer } from '../../utils/audio';
import { triggerGrandCelebration, triggerQuickSparkle } from '../../utils/confetti';

interface ClassroomGroupsStationProps {
  currentUser: UserProfile;
  classroomGroups: ClassroomGroup[];
  allUsers: UserProfile[];
  onJoinGroup: (groupId: string, studentId: string) => void;
  onLeaveGroup?: (groupId: string, studentId: string) => void;
  onCreateGroup: (newGroup: ClassroomGroup) => void;
  onUpdateGroupPassword: (groupId: string, newPassword: string) => void;
  onRemoveStudentFromGroup: (groupId: string, studentId: string) => void;
  onNavigateTab: (tabId: string) => void;
}

export const ClassroomGroupsStation: React.FC<ClassroomGroupsStationProps> = ({
  currentUser,
  classroomGroups,
  allUsers,
  onJoinGroup,
  onLeaveGroup,
  onCreateGroup,
  onUpdateGroupPassword,
  onRemoveStudentFromGroup,
  onNavigateTab
}) => {
  // Student Join Form State
  const [inputCodeOrLink, setInputCodeOrLink] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

  // Faculty Create Group State
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [newDivision, setNewDivision] = useState<'A' | 'B'>(currentUser.division || 'A');
  const [newGroupPassword, setNewGroupPassword] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Password Reveal & Edit States for Faculty
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [editingPasswordGroupId, setEditingPasswordGroupId] = useState<string | null>(null);
  const [editedPasswordValue, setEditedPasswordValue] = useState('');

  // Copy Feedback State
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Helper to copy to clipboard with feedback
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    triggerQuickSparkle();
    setTimeout(() => {
      setCopiedKey(null);
    }, 2200);
  };

  // Helper to parse code from pasted link or raw code
  const parseInviteCode = (input: string): string => {
    const trimmed = input.trim();
    if (trimmed.includes('code=')) {
      try {
        const url = new URL(trimmed);
        const code = url.searchParams.get('code');
        if (code) return code.trim();
      } catch {
        const match = trimmed.match(/code=([^&#\s]+)/);
        if (match && match[1]) return match[1].trim();
      }
    }
    return trimmed;
  };

  // Student Join Handler with Strict Password Check
  const handleStudentJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    setJoinSuccess(null);

    const parsedCode = parseInviteCode(inputCodeOrLink);

    if (!parsedCode) {
      setJoinError('Please enter a valid Group Invite Code or paste the invite link.');
      playWarningBuzzer();
      return;
    }

    if (!inputPassword.trim()) {
      setJoinError('Please enter the secret group password provided by your faculty.');
      playWarningBuzzer();
      return;
    }

    // Find group by inviteCode or id
    const targetGroup = classroomGroups.find(
      (g) =>
        g.inviteCode.toLowerCase() === parsedCode.toLowerCase() ||
        g.id.toLowerCase() === parsedCode.toLowerCase()
    );

    if (!targetGroup) {
      setJoinError(
        `Classroom group with code "${parsedCode}" not found. Please verify the code with your faculty.`
      );
      playWarningBuzzer();
      return;
    }

    // Check if student is already enrolled
    if (targetGroup.enrolledStudentIds.includes(currentUser.id)) {
      setJoinError(`You are already enrolled in "${targetGroup.courseCode}: ${targetGroup.courseName}".`);
      playWarningBuzzer();
      return;
    }

    // Strict Password Validation
    if (targetGroup.groupPassword.trim() !== inputPassword.trim()) {
      setJoinError(
        `❌ INCORRECT PASSWORD: The secret password you entered does not match faculty records for "${targetGroup.courseCode}". Please ask ${targetGroup.facultyName} for the exact password.`
      );
      playWarningBuzzer();
      return;
    }

    // Successful enrollment
    onJoinGroup(targetGroup.id, currentUser.id);
    playSuccessChime();
    triggerGrandCelebration();
    setJoinSuccess(
      `🎉 SUCCESS! You have been verified and added to ${targetGroup.courseCode}: ${targetGroup.courseName} (${targetGroup.facultyName}). You earned +25 Enrollment Gems!`
    );
    setInputCodeOrLink('');
    setInputPassword('');
  };

  // Faculty Create Group Handler
  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseCode.trim() || !newCourseName.trim() || !newGroupPassword.trim()) {
      playWarningBuzzer();
      return;
    }

    const cleanCode = newCourseCode.trim().toUpperCase().replace(/\s+/g, '');
    const genInviteCode = `${cleanCode}-${newDivision}${Math.floor(100 + Math.random() * 900)}`;

    const newGroup: ClassroomGroup = {
      id: `grp-${cleanCode.toLowerCase()}-${Date.now().toString().slice(-4)}`,
      courseCode: cleanCode,
      courseName: newCourseName.trim(),
      division: newDivision,
      facultyId: currentUser.id,
      facultyName: currentUser.name,
      facultyAvatar: currentUser.avatar,
      groupPassword: newGroupPassword.trim(),
      inviteCode: genInviteCode,
      inviteLink: `https://studyphantom.edu/join?code=${genInviteCode}`,
      enrolledStudentIds: [],
      createdAt: new Date().toISOString().split('T')[0],
      description: newDescription.trim() || `${newCourseName} classroom and lab sessions.`
    };

    onCreateGroup(newGroup);
    playSuccessChime();
    triggerGrandCelebration();
    setIsCreatingGroup(false);
    setNewCourseCode('');
    setNewCourseName('');
    setNewGroupPassword('');
    setNewDescription('');
  };

  // Groups created by this faculty (if faculty)
  const myFacultyGroups = classroomGroups.filter((g) => g.facultyId === currentUser.id);

  // Groups enrolled by this student (if student)
  const myEnrolledGroups = classroomGroups.filter((g) =>
    g.enrolledStudentIds.includes(currentUser.id)
  );

  // Groups available to join (for students)
  const availableGroupsToJoin = classroomGroups.filter(
    (g) => !g.enrolledStudentIds.includes(currentUser.id)
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner: Google Classroom Style Group Enrollment & Security */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/80 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Google Classroom Group Architecture
              </span>
              <span className="text-xs text-slate-400">
                {currentUser.role === 'faculty'
                  ? 'Faculty Link & Password Generator'
                  : 'Student Secure Access Join'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Users className="w-8 h-8 text-indigo-400" />
              Classroom Groups & Access Passwords
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {currentUser.role === 'faculty'
                ? 'Faculty creates course groups and shares the generated Group Link along with a Secret Group Password. Students can only enter your group if they submit the exact password.'
                : 'Join your professor’s official classroom group using the invite link / code and the secret group password provided by your faculty in class.'}
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {/* 2D Vector Classroom Vault Asset */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden ring-2 ring-violet-500/50 shadow-xl shadow-violet-600/30 shrink-0 bg-slate-950 transform hover:scale-105 transition" title="2D Classroom Security Vault">
              <img
                src={IMAGES_2D.classroomVault}
                alt="Classroom Security Vault 2D Vector"
                className="w-full h-full object-cover"
                onError={(e) => handleImageError(e, PUBLIC_IMAGES.classroomVault)}
              />
            </div>

            {currentUser.role === 'faculty' && (
              <button
                onClick={() => setIsCreatingGroup(true)}
                className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-indigo-600/30 whitespace-nowrap self-start md:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Classroom Group</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* STUDENT VIEW: JOIN GROUP BY LINK & PASSWORD + ENROLLED GROUPS  */}
      {/* ============================================================== */}
      {currentUser.role === 'student' && (
        <div className="space-y-8">
          {/* Main Join Classroom Box (Google Classroom Style) */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-950/80 border border-indigo-700/60 flex items-center justify-center text-indigo-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white tracking-tight">
                    Join Classroom Group
                  </h2>
                  <p className="text-xs text-slate-400">
                    Enter the invite code (or link) and the secret password provided by your faculty
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono text-amber-300 bg-amber-950/50 border border-amber-700/40 px-2.5 py-1 rounded-full hidden sm:inline-flex items-center gap-1 font-bold">
                <Sparkles className="w-3 h-3 text-amber-400" /> +25 Gems on Join
              </span>
            </div>

            {/* Error & Success Messages */}
            {joinError && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-950/60 border border-rose-700 text-rose-200 text-xs flex items-start gap-3 animate-in shake">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">{joinError}</div>
              </div>
            )}

            {joinSuccess && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-950/60 border border-emerald-600 text-emerald-200 text-xs flex items-start gap-3 animate-in fade-in">
                <UserCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed font-semibold">{joinSuccess}</div>
              </div>
            )}

            <form onSubmit={handleStudentJoin} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Field 1: Group Invite Code or Link */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Group Invite Code or Link</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={inputCodeOrLink}
                    onChange={(e) => setInputCodeOrLink(e.target.value)}
                    placeholder="e.g. CD-A101 or https://studyphantom.edu/join?code=CD-A101"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                  />
                  <p className="text-[11px] text-slate-400">
                    Paste the invite link directly or type the short group code from your professor.
                  </p>
                </div>

                {/* Field 2: Secret Group Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Faculty Group Secret Password</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={inputPassword}
                      onChange={(e) => setInputPassword(e.target.value)}
                      placeholder="e.g. ALGO#2024 or KERN#8890"
                      className="w-full px-4 py-3 pr-10 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Mandatory secret password set by faculty. Case-sensitive.
                  </p>
                </div>
              </div>

              {/* Quick Preset Selector for Easy Testing */}
              {availableGroupsToJoin.length > 0 && (
                <div className="pt-2">
                  <div className="text-[11px] text-slate-400 mb-2 flex items-center gap-1.5 font-medium">
                    <span>Quick test autofill (active college classes available):</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableGroupsToJoin.map((grp) => (
                      <button
                        key={grp.id}
                        type="button"
                        onClick={() => {
                          setInputCodeOrLink(grp.inviteCode);
                          setInputPassword(grp.groupPassword);
                          setJoinError(null);
                        }}
                        className="text-[11px] px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-600/60 text-slate-300 hover:text-indigo-200 flex items-center gap-1.5 transition font-mono"
                      >
                        <KeyRound className="w-3 h-3 text-indigo-400" />
                        <span>{grp.courseCode} ({grp.facultyName.split(' ')[1]})</span>
                        <span className="text-slate-500">[{grp.inviteCode}]</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition transform hover:scale-[1.02]"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Verify Password & Join Classroom</span>
                </button>
              </div>
            </form>
          </div>

          {/* Enrolled Classes List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-400" />
                  My Enrolled Classroom Groups ({myEnrolledGroups.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Classes you have successfully unlocked with faculty password
                </p>
              </div>
            </div>

            {myEnrolledGroups.length === 0 ? (
              <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 text-center space-y-3">
                <Users className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-300">No Enrolled Classes Yet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Ask your faculty for their group invite link and secret password, then paste them above to join your division courses!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {myEnrolledGroups.map((grp) => (
                  <div
                    key={grp.id}
                    className="rounded-3xl bg-slate-900 border border-slate-800 hover:border-indigo-500/60 p-5 shadow-lg flex flex-col justify-between transition group"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/60">
                          {grp.courseCode} • Div {grp.division}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-700/40 px-2 py-0.5 rounded-md flex items-center gap-1 font-semibold">
                          <Check className="w-3 h-3" /> Enrolled
                        </span>
                      </div>

                      <h3 className="text-base font-black text-white group-hover:text-indigo-300 transition line-clamp-1">
                        {grp.courseName}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {grp.description}
                      </p>

                      {/* Faculty Info */}
                      <div className="mt-4 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
                        <img
                          src={grp.facultyAvatar}
                          alt={grp.facultyName}
                          className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-700"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-200 truncate">
                            {grp.facultyName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            Course Mentor
                          </div>
                        </div>
                      </div>

                      {/* Group Details */}
                      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">Invite Code:</span>
                          <span className="text-indigo-300 font-bold">{grp.inviteCode}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">Total Peers:</span>
                          <span className="text-emerald-400 font-bold">{grp.enrolledStudentIds.length} Students</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Shortcuts */}
                    <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => onNavigateTab('assignments')}
                          className="py-2 px-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Assignments</span>
                        </button>
                        <button
                          onClick={() => onNavigateTab('notes')}
                          className="py-2 px-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                          <span>Notes</span>
                        </button>
                      </div>

                      {onLeaveGroup && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Leave ${grp.courseCode} classroom group?`)) {
                              onLeaveGroup(grp.id, currentUser.id);
                            }
                          }}
                          className="w-full text-center py-1 text-[10px] text-slate-500 hover:text-rose-400 font-mono transition"
                        >
                          Leave Classroom Group
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* FACULTY VIEW: MANAGE GROUPS, SHARE LINK & PASSWORD, ROSTER     */}
      {/* ============================================================== */}
      {currentUser.role === 'faculty' && (
        <div className="space-y-8">
          {/* Create Group Modal */}
          {isCreatingGroup && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700 p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-950 border border-indigo-700/60 flex items-center justify-center text-indigo-400">
                      <Plus className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-black text-white">Create New Classroom Group</h2>
                  </div>
                  <button
                    onClick={() => setIsCreatingGroup(false)}
                    className="text-slate-400 hover:text-white text-xs font-mono"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleCreateGroupSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        Course Code <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newCourseCode}
                        onChange={(e) => setNewCourseCode(e.target.value)}
                        placeholder="e.g. CS302"
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        Division <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={newDivision}
                        onChange={(e) => setNewDivision(e.target.value as 'A' | 'B')}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-indigo-500 outline-none"
                      >
                        <option value="A">Division A</option>
                        <option value="B">Division B</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Course Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newCourseName}
                      onChange={(e) => setNewCourseName(e.target.value)}
                      placeholder="e.g. Compiler Design & Code Generation"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-indigo-500 outline-none"
                    />
                  </div>

                  {/* Secret Group Password Setting */}
                  <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-700/50 space-y-1.5">
                    <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span>Set Group Secret Password <span className="text-rose-400">*</span></span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newGroupPassword}
                      onChange={(e) => setNewGroupPassword(e.target.value)}
                      placeholder="e.g. ALGO#2026 or PASS#303"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-amber-600/50 text-white text-xs font-mono focus:border-amber-400 outline-none"
                    />
                    <p className="text-[11px] text-amber-200/80 leading-relaxed">
                      Students MUST type this exact password to join your classroom group. You will share this password along with the group link.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Course Description / Topics
                    </label>
                    <textarea
                      rows={2}
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Brief course objectives and syllabus modules..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsCreatingGroup(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Classroom & Generate Link</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Groups List with Share Link & Password Cards */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  My Classroom Groups & Enrolled Rosters ({myFacultyGroups.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Share the Group Link and Secret Password below with your students
                </p>
              </div>
            </div>

            {myFacultyGroups.length === 0 ? (
              <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 text-center space-y-3">
                <Users className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-300">No Classroom Groups Created Yet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Click the button below to create your first classroom group and generate an invite link with secret password for students.
                </p>
                <button
                  onClick={() => setIsCreatingGroup(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs inline-flex items-center gap-2 shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Classroom Group</span>
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {myFacultyGroups.map((grp) => {
                  const isPasswordRevealed = !!revealedPasswords[grp.id];
                  const enrolledStudents = allUsers.filter((u) =>
                    grp.enrolledStudentIds.includes(u.id)
                  );

                  // Formatted Share Message for WhatsApp / Telegram / Notice Board
                  const shareText = `📚 *Study Phantom Classroom Invitation*\n\nCourse: *${grp.courseCode} - ${grp.courseName}*\nFaculty: *${grp.facultyName}*\nDivision: *Division ${grp.division}*\n\n🔗 *Invite Link:* ${grp.inviteLink}\n🆔 *Group Code:* ${grp.inviteCode}\n🔒 *Secret Group Password:* ${grp.groupPassword}\n\n⚠️ *Important:* You must enter the exact secret password (${grp.groupPassword}) on Study Phantom to join this group.`;

                  return (
                    <div
                      key={grp.id}
                      className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-6 relative overflow-hidden"
                    >
                      {/* Course Header Banner */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/60">
                              {grp.courseCode} • Division {grp.division}
                            </span>
                            <span className="text-xs text-slate-400">
                              Created on {grp.createdAt}
                            </span>
                          </div>
                          <h3 className="text-xl font-black text-white">
                            {grp.courseName}
                          </h3>
                          <p className="text-xs text-slate-400 max-w-2xl">
                            {grp.description}
                          </p>
                        </div>

                        {/* Quick Action: Copy Complete Share Kit */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopy(shareText, `share-${grp.id}`)}
                            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition"
                          >
                            {copiedKey === `share-${grp.id}` ? (
                              <>
                                <Check className="w-4 h-4 text-white" />
                                <span>Invite Notice Copied!</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                <span>Copy Full Invite Notice</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* THE CRITICAL PAIR: Group Invite Link & Secret Password Box */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 1. Group Invite Link Card */}
                        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                <LinkIcon className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Group Invite Link</span>
                              </span>
                              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800">
                                Code: {grp.inviteCode}
                              </span>
                            </div>
                            <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300 truncate select-all">
                              {grp.inviteLink}
                            </div>
                          </div>

                          <button
                            onClick={() => handleCopy(grp.inviteLink, `link-${grp.id}`)}
                            className="w-full py-2.5 px-3 rounded-xl bg-indigo-950/80 hover:bg-indigo-900/80 border border-indigo-700/60 text-indigo-300 font-bold text-xs flex items-center justify-center gap-2 transition"
                          >
                            {copiedKey === `link-${grp.id}` ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-400" />
                                <span className="text-emerald-400">Invite Link Copied to Clipboard!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                <span>Copy Group Invite Link</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* 2. Group Secret Password Card */}
                        <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-600/40 flex flex-col justify-between space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                                <Lock className="w-3.5 h-3.5 text-amber-400" />
                                <span>Secret Join Password (Required for Students)</span>
                              </span>
                              <button
                                onClick={() =>
                                  setRevealedPasswords((prev) => ({
                                    ...prev,
                                    [grp.id]: !prev[grp.id]
                                  }))
                                }
                                className="text-[11px] text-amber-400 hover:text-amber-300 font-mono flex items-center gap-1"
                              >
                                {isPasswordRevealed ? (
                                  <>
                                    <EyeOff className="w-3.5 h-3.5" />
                                    <span>Hide</span>
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Show</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Password Display / Edit */}
                            {editingPasswordGroupId === grp.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editedPasswordValue}
                                  onChange={(e) => setEditedPasswordValue(e.target.value)}
                                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-amber-500 text-white font-mono text-xs focus:outline-none"
                                />
                                <button
                                  onClick={() => {
                                    if (editedPasswordValue.trim()) {
                                      onUpdateGroupPassword(grp.id, editedPasswordValue.trim());
                                      setEditingPasswordGroupId(null);
                                      triggerQuickSparkle();
                                    }
                                  }}
                                  className="px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingPasswordGroupId(null)}
                                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="px-3 py-2 rounded-xl bg-slate-950 border border-amber-800/60 font-mono text-xs font-bold text-amber-300 flex items-center justify-between">
                                <span>{isPasswordRevealed ? grp.groupPassword : '••••••••••••'}</span>
                                <button
                                  onClick={() => {
                                    setEditingPasswordGroupId(grp.id);
                                    setEditedPasswordValue(grp.groupPassword);
                                  }}
                                  className="text-[10px] text-amber-400/80 hover:text-amber-300 font-mono underline flex items-center gap-1"
                                >
                                  <Edit2 className="w-3 h-3" /> Change
                                </button>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleCopy(grp.groupPassword, `pwd-${grp.id}`)}
                            className="w-full py-2.5 px-3 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 border border-amber-600/50 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition"
                          >
                            {copiedKey === `pwd-${grp.id}` ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-400" />
                                <span className="text-emerald-400">Password Copied to Clipboard!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                <span>Copy Secret Password</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Enrolled Students Roster Table */}
                      <div className="pt-2">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-emerald-400" />
                            <span>
                              Enrolled Students ({enrolledStudents.length} Verified with Password)
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400">
                            Division {grp.division} Classroom
                          </span>
                        </div>

                        {enrolledStudents.length === 0 ? (
                          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-500">
                            No students have joined yet. Share the invite link and password above with your students!
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {enrolledStudents.map((stu) => (
                              <div
                                key={stu.id}
                                className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 transition"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <img
                                    src={stu.avatar}
                                    alt={stu.name}
                                    className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-700 shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-white truncate">
                                      {stu.name}
                                    </div>
                                    <div className="text-[10px] font-mono text-slate-400 truncate">
                                      {stu.rollNumber} • {stu.attendancePercent}% Att.
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/40">
                                    {stu.gems} 💎
                                  </span>
                                  <button
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          `Remove ${stu.name} from ${grp.courseCode}? They will need the password again to rejoin.`
                                        )
                                      ) {
                                        onRemoveStudentFromGroup(grp.id, stu.id);
                                      }
                                    }}
                                    title="Remove Student"
                                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/50 transition"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
