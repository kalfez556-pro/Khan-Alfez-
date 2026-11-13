import React from 'react';
import { UserProfile } from '../../types';
import { IMAGES_2D, handleImageError, PUBLIC_IMAGES } from '../../assets/images';
import {
  QrCode,
  FileText,
  BookOpen,
  Trophy,
  Timer,
  ShoppingBag,
  ArrowUpRight,
  Sparkles,
  Flame,
  ShieldCheck,
  Users,
  Bot,
  UserCog,
  Crown,
  ChevronRight,
  TrendingUp,
  Zap,
  Layers,
  Box,
  Mic
} from 'lucide-react';

interface SquareHubProps {
  currentUser: UserProfile;
  allUsers?: UserProfile[];
  onNavigateTab: (tabId: string) => void;
  onOpenAuthPortal: () => void;
  onOpenProfileModal?: () => void;
  totalAssignments: number;
  totalNotes: number;
}

export const SquareHubDashboard: React.FC<SquareHubProps> = ({
  currentUser,
  allUsers = [],
  onNavigateTab,
  onOpenAuthPortal,
  onOpenProfileModal,
  totalAssignments,
  totalNotes
}) => {
  // Sort students strictly by gems from #1 Top to lowest
  const rankedStudents = [...allUsers]
    .filter((u) => u.role === 'student')
    .sort((a, b) => b.gems - a.gems);

  const highestGems = rankedStudents.length > 0 ? rankedStudents[0].gems : 300;

  // Faculty-specific Square Modules with clean light academic palette
  const facultyModules = [
    {
      id: 'groups',
      title: 'Classroom Groups & Passwords',
      subtitle: 'Share Group Invite Link & Secret Password to Enroll Students',
      stat: 'Classroom Security Hub',
      themeClass: 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-md',
      iconColor: 'text-blue-600 bg-blue-50 border-blue-200',
      badge: 'Classroom Vault',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Users,
      image2D: IMAGES_2D.classroomVault
    },
    {
      id: 'attendance',
      title: 'QR Attendance Projector',
      subtitle: 'Dynamic Classroom QR Code & Live Anti-Proxy Audit',
      stat: 'Faculty Projector Screen',
      themeClass: 'bg-white border-slate-200 hover:border-emerald-400 hover:shadow-md',
      iconColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      badge: 'QR Scanner Hub',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: QrCode,
      image2D: IMAGES_2D.qrProjector
    },
    {
      id: 'assignments',
      title: 'Lab Assignments & Grading',
      subtitle: 'Publish Course Lab Manuals & Grade Student Reports Inline',
      stat: `${totalAssignments} Active Labs`,
      themeClass: 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-md',
      iconColor: 'text-sky-600 bg-sky-50 border-sky-200',
      badge: 'Coding Terminal',
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
      icon: FileText,
      image2D: IMAGES_2D.labSubmission
    },
    {
      id: 'notes',
      title: 'Course Notes & PDFs',
      subtitle: 'Upload Official University Monographs & Formula Sheets',
      stat: `${totalNotes} Chapters Published`,
      themeClass: 'bg-white border-slate-200 hover:border-slate-400 hover:shadow-md',
      iconColor: 'text-slate-700 bg-slate-100 border-slate-200',
      badge: 'Study Codex',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: BookOpen,
      image2D: IMAGES_2D.studyNotes
    },
    {
      id: 'leaderboard',
      title: 'Student Performance Dashboard',
      subtitle: 'Ranked by Gems: #1 Top Performer down to Lowest Student',
      stat: 'Live Student Rankings',
      themeClass: 'bg-white border-slate-200 hover:border-amber-400 hover:shadow-md',
      iconColor: 'text-amber-600 bg-amber-50 border-amber-200',
      badge: 'Gold Trophy Tier',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: Trophy,
      image2D: IMAGES_2D.trophyGems
    }
  ];

  // Student-specific Square Modules with clean light academic palette
  const studentModules = [
    {
      id: 'groups',
      title: 'Join Classroom with Password',
      subtitle: 'Enter Faculty Secret Password to Unlock Courses',
      stat: 'Classroom Hub',
      themeClass: 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-md',
      iconColor: 'text-blue-600 bg-blue-50 border-blue-200',
      badge: 'Passkey Portal',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Users,
      image2D: IMAGES_2D.classroomVault
    },
    {
      id: 'attendance',
      title: 'Scan Classroom Attendance',
      subtitle: 'CameraX / ML Kit Live Scanner for Div A/B',
      stat: `${currentUser.attendancePercent}% Enrolled Attendance`,
      themeClass: 'bg-white border-slate-200 hover:border-emerald-400 hover:shadow-md',
      iconColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      badge: 'Live Scanner',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: QrCode,
      image2D: IMAGES_2D.qrProjector
    },
    {
      id: 'assignments',
      title: 'My Lab Workstation',
      subtitle: 'Submit Lab PDF Reports with Execution Benchmarks',
      stat: `${totalAssignments} Active Labs`,
      themeClass: 'bg-white border-slate-200 hover:border-sky-400 hover:shadow-md',
      iconColor: 'text-sky-600 bg-sky-50 border-sky-200',
      badge: 'Submission Bay',
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
      icon: FileText,
      image2D: IMAGES_2D.labSubmission
    },
    {
      id: 'notes',
      title: 'Study Notes & PDF Reader',
      subtitle: 'In-Page Reader, Zoom Controls & Formula Sheets',
      stat: `${totalNotes} Chapters Available`,
      themeClass: 'bg-white border-slate-200 hover:border-slate-400 hover:shadow-md',
      iconColor: 'text-slate-700 bg-slate-100 border-slate-200',
      badge: 'Digital Library',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: BookOpen,
      image2D: IMAGES_2D.studyNotes
    },
    {
      id: 'ai',
      title: 'Academic AI Tutor',
      subtitle: 'Ask Doubts on Notes, Labs & Exam Questions',
      stat: 'Contextual AI Helper',
      themeClass: 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-md',
      iconColor: 'text-blue-600 bg-blue-50 border-blue-200',
      badge: 'AI Tutor',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Bot,
      image2D: IMAGES_2D.aiNeuralCore
    },
    {
      id: 'quizzes',
      title: 'Quizzes & Weekly Mega Test',
      subtitle: 'Daily Adaptive Sprints & Dynamic Tiers',
      stat: 'Earn up to +250 Gems',
      themeClass: 'bg-white border-slate-200 hover:border-rose-400 hover:shadow-md',
      iconColor: 'text-rose-600 bg-rose-50 border-rose-200',
      badge: 'Battle Arena',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: Trophy,
      image2D: IMAGES_2D.trophyGems
    },
    {
      id: 'pomodoro',
      title: 'Ultimate Focus Mode',
      subtitle: 'Self-Set Custom Timer & 40Hz Binaural Beats',
      stat: `${currentUser.streakDays}-Day Streak`,
      themeClass: 'bg-white border-slate-200 hover:border-orange-400 hover:shadow-md',
      iconColor: 'text-orange-600 bg-orange-50 border-orange-200',
      badge: 'Focus Chronometer',
      badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
      icon: Timer,
      image2D: IMAGES_2D.focusTimer
    },
    {
      id: 'store',
      title: 'Gem Rewards & Perks Store',
      subtitle: 'Streak Freezes, Priority Grading & Badges',
      stat: `${currentUser.gems} Gems Available`,
      themeClass: 'bg-white border-slate-200 hover:border-amber-400 hover:shadow-md',
      iconColor: 'text-amber-600 bg-amber-50 border-amber-200',
      badge: 'Academic Rewards',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: ShoppingBag,
      image2D: IMAGES_2D.trophyGems
    }
  ];

  const modules = currentUser.role === 'faculty' ? facultyModules : studentModules;

  return (
    <div className="space-y-8">
      {/* ============================================================== */}
      {/* CLEAN ACADEMIC HERO BANNER                                     */}
      {/* ============================================================== */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3.5 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[11px] font-mono uppercase px-3 py-1 rounded-full font-bold bg-blue-50 border border-blue-200 text-blue-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Study Phantom Ecosystem</span>
              </span>

              <span className="text-xs text-slate-500 font-medium">
                {currentUser.role === 'faculty' ? 'Faculty Command' : `Div ${currentUser.division} Student`} • {currentUser.department}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Welcome back, <span className="text-blue-600 font-extrabold">{currentUser.name}</span>!
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
              {currentUser.role === 'faculty'
                ? 'Manage classroom passwords, project dynamic QR attendance, inline grade lab reports, and audit live student gems rankings.'
                : 'Unlock professor classrooms with secret passkeys, scan dynamic QR attendance, submit lab benchmarks, and earn gems.'}
            </p>

            {/* Quick launch buttons */}
            <div className="flex items-center gap-2.5 pt-1.5 flex-wrap">
              <button
                onClick={() => onNavigateTab('attendance')}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{currentUser.role === 'faculty' ? 'Launch QR Projector' : 'Scan Attendance QR'}</span>
              </button>

              <button
                onClick={() => onNavigateTab('ai')}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Ask AI Academic Tutor</span>
              </button>

              <button
                onClick={() => window.dispatchEvent(new CustomEvent('trigger-jarvis'))}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                title='Activate Jarvis Voice Assistant (Say "Hey Jarvis")'
              >
                <Mic className="w-3.5 h-3.5 text-blue-300" />
                <span>Hey Jarvis Voice</span>
              </button>

              <button
                onClick={() => onNavigateTab('groups')}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Users className="w-3.5 h-3.5 text-slate-600" />
                <span>Classroom Passwords</span>
              </button>
            </div>
          </div>

          {/* Clean User Profile Card */}
          <div className="flex items-center gap-4 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 shrink-0">
            <div
              onClick={onOpenProfileModal}
              title="Click to change photo and profile details"
              className="relative cursor-pointer group shrink-0"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover ring-2 ring-blue-200 group-hover:ring-blue-500 transition shadow-xs"
                onError={(e) => {
                  e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%232563eb"/><text x="50%" y="55%" font-family="sans-serif" font-size="64" font-weight="bold" fill="%23ffffff" dominant-baseline="middle" text-anchor="middle">${encodeURIComponent(currentUser.name.charAt(0))}</text></svg>`;
                }}
              />
              <div className="absolute inset-0 bg-slate-900/50 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white">
                <UserCog className="w-5 h-5" />
              </div>
            </div>

            <div>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>{currentUser.name}</span>
                {currentUser.hasStreakFreeze && (
                  <span title="Streak Shield Active">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </span>
                )}
              </div>

              {currentUser.role === 'student' ? (
                <div className="text-xs font-mono font-bold mt-1.5 flex items-center gap-2">
                  <span className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-lg border border-amber-200">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{currentUser.gems} Gems</span>
                  </span>
                  <span className="flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200 text-orange-700">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    <span>{currentUser.streakDays}d Streak</span>
                  </span>
                </div>
              ) : (
                <div className="text-xs text-slate-600 font-mono font-semibold mt-1">
                  <span>{currentUser.title.split('(')[0]}</span>
                </div>
              )}

              <div className="flex items-center gap-3 mt-2.5">
                {onOpenProfileModal && (
                  <button
                    onClick={onOpenProfileModal}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 transition"
                  >
                    <UserCog className="w-3.5 h-3.5" />
                    <span>Edit Profile & Photo</span>
                  </button>
                )}
                <span className="text-slate-300 text-xs">|</span>
                <button
                  onClick={onOpenAuthPortal}
                  className="text-xs text-slate-600 hover:text-slate-900 font-mono underline"
                >
                  Switch Role
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* FACULTY VIEW: LIVE STUDENT PERFORMANCE LEADERBOARD PREVIEW      */}
      {/* ============================================================== */}
      {currentUser.role === 'faculty' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5 relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border border-amber-300 shadow-xs shrink-0">
                <img
                  src={IMAGES_2D.trophyGems}
                  alt="Gold Trophy"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    Student Performance Dashboard
                  </h2>
                  <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-bold">
                    Rank #1 (Highest Gems) to Lowest
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Live ranking of all enrolled students sorted strictly by academic gems earned
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('leaderboard')}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs shrink-0"
            >
              <span>View Full 360° Leaderboard</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Ranked Student Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5 relative z-10">
            {rankedStudents.map((student, index) => {
              const rank = index + 1;
              const isTop1 = rank === 1;
              const isTop2 = rank === 2;
              const isTop3 = rank === 3;
              const gemPercentage = Math.round((student.gems / Math.max(highestGems, 1)) * 100);

              return (
                <div
                  key={student.id}
                  className={`relative p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                    isTop1
                      ? 'bg-amber-50/60 border-amber-300 shadow-xs'
                      : isTop2
                      ? 'bg-blue-50/50 border-blue-200 shadow-xs'
                      : isTop3
                      ? 'bg-orange-50/50 border-orange-200 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Top Rank Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-7 h-7 rounded-xl font-black text-xs font-mono flex items-center justify-center ${
                        isTop1
                          ? 'bg-amber-400 text-slate-950'
                          : isTop2
                          ? 'bg-blue-100 text-blue-800'
                          : isTop3
                          ? 'bg-orange-200 text-orange-900'
                          : 'bg-slate-200 text-slate-700 font-mono'
                      }`}>
                        #{rank}
                      </span>
                      {isTop1 && (
                        <Crown className="w-4 h-4 text-amber-500" />
                      )}
                    </div>

                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-bold">
                      Div {student.division || 'A'}
                    </span>
                  </div>

                  {/* Student Info */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <img
                      src={student.avatar}
                      alt={student.name}
                      className={`w-10 h-10 rounded-xl object-cover ring-2 ${
                        isTop1 ? 'ring-amber-400' : 'ring-slate-200'
                      }`}
                      onError={(e) => {
                        e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23e2e8f0"/><text x="50%" y="55%" font-family="sans-serif" font-size="32" font-weight="bold" fill="%23475569" dominant-baseline="middle" text-anchor="middle">${encodeURIComponent(student.name.charAt(0))}</text></svg>`;
                      }}
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{student.name}</h4>
                      <p className="text-[11px] font-mono text-slate-500 truncate">{student.rollNumber}</p>
                    </div>
                  </div>

                  {/* Gems Meter & Bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono mb-1">
                      <span className="text-slate-500 text-[10px]">Academic Gems</span>
                      <span className={`font-bold flex items-center gap-1 ${
                        isTop1 ? 'text-amber-700' : 'text-blue-700'
                      }`}>
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        {student.gems}
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isTop1
                            ? 'bg-amber-500'
                            : isTop2
                            ? 'bg-blue-500'
                            : isTop3
                            ? 'bg-orange-500'
                            : 'bg-slate-600'
                        }`}
                        style={{ width: `${Math.max(10, gemPercentage)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-200/80">
                      <span>Attendance</span>
                      <span className={`font-mono font-bold ${
                        student.attendancePercent >= 75 ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {student.attendancePercent}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ECOSYSTEM WORKSTATIONS (SIMPLE, CLEAN LIGHT CARDS)             */}
      {/* ============================================================== */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Ecosystem Workstations</span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Select any module card below to open its dedicated academic workstation
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.id}
                onClick={() => onNavigateTab(mod.id)}
                className={`rounded-3xl p-5 border shadow-xs transition-all duration-200 flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:-translate-y-0.5 ${mod.themeClass}`}
              >
                {/* Top Badge & Clean Icon + Thumbnail */}
                <div className="flex items-start justify-between gap-2 mb-4">
                  <span className={`text-[10px] font-mono uppercase font-bold px-2.5 py-1 rounded-full border ${mod.badgeColor}`}>
                    {mod.badge}
                  </span>
                  <div className="flex items-center gap-2">
                    {mod.image2D && (
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
                        <img
                          src={mod.image2D}
                          alt={mod.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => handleImageError(e)}
                        />
                      </div>
                    )}
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition ${mod.iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Bottom Content with Clean Contrast */}
                <div>
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-700 mb-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>{mod.stat}</span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition leading-snug">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {mod.subtitle}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 group-hover:text-blue-600">
                    <span>Enter Station</span>
                    <div className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center transition">
                      <ArrowUpRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
