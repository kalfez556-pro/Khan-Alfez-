import React, { useState } from 'react';
import { UserProfile, Division } from '../../types';
import { IMAGES_2D, IMAGES_3D, handleImageError, PUBLIC_IMAGES } from '../../assets/images';
import { playSuccessChime } from '../../utils/audio';
import { triggerQuickSparkle } from '../../utils/confetti';
import {
  Trophy,
  Crown,
  Medal,
  Sparkles,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Award,
  Flame,
  ArrowUpDown,
  FileSpreadsheet,
  Send,
  Users
} from 'lucide-react';

interface StudentLeaderboardProps {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onAwardBonusGems: (studentId: string, bonusGems: number) => void;
}

// Extended student records for university cohort simulation
interface ExtendedStudentProfile {
  id: string;
  name: string;
  rollNumber: string;
  division: Division;
  avatar: string;
  gems: number;
  attendancePercent: number;
  streakDays: number;
  labsSubmitted: number;
  totalLabs: number;
  tier: 'Grandmaster' | 'Diamond' | 'Gold' | 'Silver' | 'Bronze';
}

export const FacultyStudentLeaderboard: React.FC<StudentLeaderboardProps> = ({
  currentUser,
  allUsers,
  onAwardBonusGems
}) => {
  const [selectedDivision, setSelectedDivision] = useState<'ALL' | 'A' | 'B'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAtRisk, setFilterAtRisk] = useState(false);
  const [actionNotification, setActionNotification] = useState<string | null>(null);

  // Cohort of students combining actual profiles + classmates
  const baseStudents: ExtendedStudentProfile[] = [
    {
      id: 'stu-2',
      name: 'Priya Patel',
      rollNumber: 'CS2024-089',
      division: 'B',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      gems: allUsers.find((u) => u.id === 'stu-2')?.gems ?? 340,
      attendancePercent: allUsers.find((u) => u.id === 'stu-2')?.attendancePercent ?? 92.0,
      streakDays: allUsers.find((u) => u.id === 'stu-2')?.streakDays ?? 14,
      labsSubmitted: 3,
      totalLabs: 3,
      tier: 'Grandmaster'
    },
    {
      id: 'stu-1',
      name: 'Rahul Sharma',
      rollNumber: 'CS2024-042',
      division: 'A',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80',
      gems: allUsers.find((u) => u.id === 'stu-1')?.gems ?? 260,
      attendancePercent: allUsers.find((u) => u.id === 'stu-1')?.attendancePercent ?? 84.5,
      streakDays: allUsers.find((u) => u.id === 'stu-1')?.streakDays ?? 6,
      labsSubmitted: 3,
      totalLabs: 3,
      tier: 'Diamond'
    },
    {
      id: 'stu-3',
      name: 'Aman Verma',
      rollNumber: 'CS2024-012',
      division: 'A',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      gems: 215,
      attendancePercent: 88.0,
      streakDays: 8,
      labsSubmitted: 3,
      totalLabs: 3,
      tier: 'Gold'
    },
    {
      id: 'stu-4',
      name: 'Sneha Kulkarni',
      rollNumber: 'CS2024-071',
      division: 'B',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      gems: 190,
      attendancePercent: 82.5,
      streakDays: 5,
      labsSubmitted: 2,
      totalLabs: 3,
      tier: 'Gold'
    },
    {
      id: 'stu-5',
      name: 'Vikram Joshi',
      rollNumber: 'CS2024-055',
      division: 'B',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      gems: 145,
      attendancePercent: 74.0,
      streakDays: 3,
      labsSubmitted: 2,
      totalLabs: 3,
      tier: 'Silver'
    },
    {
      id: 'stu-6',
      name: 'Rohan Gupta',
      rollNumber: 'CS2024-028',
      division: 'A',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80',
      gems: 90,
      attendancePercent: 68.0,
      streakDays: 1,
      labsSubmitted: 1,
      totalLabs: 3,
      tier: 'Bronze'
    },
    {
      id: 'stu-7',
      name: 'Aditya Rao',
      rollNumber: 'CS2024-004',
      division: 'A',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
      gems: 45,
      attendancePercent: 58.5,
      streakDays: 0,
      labsSubmitted: 1,
      totalLabs: 3,
      tier: 'Bronze'
    }
  ];

  // STRICT REQUIREMENT: Sort all students descending by gems (Highest gems = Rank 1, down to lowest)
  const sortedStudents = [...baseStudents].sort((a, b) => b.gems - a.gems);

  // Filtering
  const filteredStudents = sortedStudents.filter((student) => {
    const matchesDiv = selectedDivision === 'ALL' || student.division === selectedDivision;
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAtRisk = !filterAtRisk || student.attendancePercent < 75 || student.gems < 100;
    return matchesDiv && matchesSearch && matchesAtRisk;
  });

  const handleGiveBonus = (student: ExtendedStudentProfile) => {
    onAwardBonusGems(student.id, 25);
    playSuccessChime();
    triggerQuickSparkle();
    setActionNotification(`Awarded +25 Academic Excellence Bonus Gems to ${student.name} (${student.rollNumber})!`);
    setTimeout(() => setActionNotification(null), 4000);
  };

  const handleSendNotice = (student: ExtendedStudentProfile) => {
    playSuccessChime();
    setActionNotification(`Sent Academic Mentoring Attendance Alert to ${student.name} (${student.attendancePercent}% attendance).`);
    setTimeout(() => setActionNotification(null), 4000);
  };

  const top3 = sortedStudents.slice(0, 3);
  const atRiskCount = sortedStudents.filter((s) => s.attendancePercent < 75).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-amber-600/20 text-amber-400">
              <Trophy className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Student Performance & Gem Leaderboard Dashboard
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Live cohort ranking strictly sorted by student gems: from Rank #1 (Top Performer) down to the lowest gems student. Monitor attendance health and award academic bonus gems.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* 2D Vector Championship Trophy Asset */}
          <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-amber-500/50 shadow-lg shadow-amber-600/30 bg-slate-950 shrink-0 transform hover:scale-105 transition" title="2D Championship Trophy">
            <img
              src={IMAGES_2D.trophyGems}
              alt="Championship Trophy 2D Vector"
              className="w-full h-full object-cover"
              onError={(e) => handleImageError(e, PUBLIC_IMAGES.trophyGems)}
            />
          </div>
          <span className="text-xs font-mono bg-purple-950 text-purple-300 border border-purple-800 px-3 py-1.5 rounded-xl font-bold">
            Faculty Console: {currentUser.name}
          </span>
        </div>
      </div>

      {/* Action Notification */}
      {actionNotification && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-200 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionNotification}</span>
          </div>
          <button
            onClick={() => setActionNotification(null)}
            className="text-slate-400 hover:text-white font-mono text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TOP 3 PODIUM (Rank #1, Rank #2, Rank #3 Visual Showcase) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* RANK #2 (Silver) */}
        {top3[1] && (
          <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-5 shadow-xl flex flex-col justify-between order-2 md:order-1 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-600">
                Rank #2 • Silver
              </span>
              <Medal className="w-6 h-6 text-slate-300" />
            </div>

            <div className="text-center my-4">
              <img
                src={top3[1].avatar}
                alt={top3[1].name}
                className="w-16 h-16 rounded-2xl object-cover mx-auto ring-2 ring-slate-400 mb-2"
              />
              <h3 className="text-base font-bold text-white">{top3[1].name}</h3>
              <span className="text-xs text-slate-400 font-mono">
                {top3[1].rollNumber} • Div {top3[1].division}
              </span>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-amber-300 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> {top3[1].gems} Gems
              </span>
              <span className="text-emerald-400 font-semibold">
                {top3[1].attendancePercent}% Att.
              </span>
            </div>
          </div>
        )}

        {/* RANK #1 (Gold Champion - Center & Prominent) */}
        {top3[0] && (
          <div className="bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-900 border-2 border-amber-500/60 rounded-3xl p-6 shadow-2xl flex flex-col justify-between order-1 md:order-2 relative overflow-hidden scale-105 z-10">
            {/* 2D Vector Gold Trophy Watermark */}
            <div className="absolute inset-0 z-0 opacity-15 pointer-events-none overflow-hidden">
              <img
                src={IMAGES_2D.trophyGems}
                alt="Gold Trophy 2D Vector"
                className="w-full h-full object-cover filter saturate-150"
                onError={(e) => handleImageError(e, PUBLIC_IMAGES.trophyGems)}
              />
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
              <span className="text-xs font-mono font-black uppercase px-3 py-1 rounded-full bg-amber-500 text-slate-950 flex items-center gap-1 shadow-md">
                <Crown className="w-3.5 h-3.5 fill-slate-950" />
                Rank #1 Champion
              </span>
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-8 rounded-xl overflow-hidden ring-1 ring-amber-400 shadow">
                  <img
                    src={IMAGES_2D.trophyGems}
                    alt="Trophy 2D Vector"
                    className="w-full h-full object-cover"
                    onError={(e) => handleImageError(e, PUBLIC_IMAGES.trophyGems)}
                  />
                </div>
                <Trophy className="w-6 h-6 text-amber-400 animate-bounce" />
              </div>
            </div>

            <div className="text-center my-4 relative z-10">
              <div className="relative inline-block">
                <img
                  src={top3[0].avatar}
                  alt={top3[0].name}
                  className="w-20 h-20 rounded-2xl object-cover mx-auto ring-4 ring-amber-400 shadow-xl mb-2"
                />
                <Crown className="w-6 h-6 text-amber-400 absolute -top-3 -right-2 drop-shadow" />
              </div>
              <h3 className="text-lg font-black text-white">{top3[0].name}</h3>
              <span className="text-xs text-amber-300 font-mono font-bold">
                {top3[0].rollNumber} • Division {top3[0].division}
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-amber-500/30 flex items-center justify-between text-xs font-mono relative z-10">
              <span className="text-amber-300 text-sm font-black flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-amber-400" /> {top3[0].gems} Gems
              </span>
              <span className="text-emerald-400 font-bold">
                {top3[0].attendancePercent}% Attendance
              </span>
            </div>
          </div>
        )}

        {/* RANK #3 (Bronze) */}
        {top3[2] && (
          <div className="bg-slate-900 border border-orange-700/50 rounded-2xl p-5 shadow-xl flex flex-col justify-between order-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-orange-950 text-orange-300 border border-orange-700">
                Rank #3 • Bronze
              </span>
              <Medal className="w-6 h-6 text-orange-400" />
            </div>

            <div className="text-center my-4">
              <img
                src={top3[2].avatar}
                alt={top3[2].name}
                className="w-16 h-16 rounded-2xl object-cover mx-auto ring-2 ring-orange-500/60 mb-2"
              />
              <h3 className="text-base font-bold text-white">{top3[2].name}</h3>
              <span className="text-xs text-slate-400 font-mono">
                {top3[2].rollNumber} • Div {top3[2].division}
              </span>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-amber-300 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> {top3[2].gems} Gems
              </span>
              <span className="text-emerald-400 font-semibold">
                {top3[2].attendancePercent}% Att.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Division Buttons */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <span className="text-[10px] font-bold uppercase font-mono text-slate-400 mr-1">
            Filter Division:
          </span>
          {(['ALL', 'A', 'B'] as const).map((div) => (
            <button
              key={div}
              onClick={() => setSelectedDivision(div)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                selectedDivision === div
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {div === 'ALL' ? 'All Cohort' : `Div ${div}`}
            </button>
          ))}
        </div>

        {/* Search & At-Risk Toggle */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search student or roll #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={() => setFilterAtRisk(!filterAtRisk)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              filterAtRisk
                ? 'bg-rose-950 text-rose-300 border border-rose-700'
                : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>At-Risk Students ({atRiskCount})</span>
          </button>
        </div>
      </div>

      {/* FULL LEADERBOARD TABLE: STRICTLY SORTED FROM HIGHEST GEMS TO LOWEST */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-white text-sm">
              Student Cohort Rankings (Ordered by Gems: #1 Top Performer to Lowest)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Showing {filteredStudents.length} of {sortedStudents.length} Students
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <th className="py-3 px-3">Rank</th>
                <th className="py-3 px-3">Student Name</th>
                <th className="py-3 px-3">Division</th>
                <th className="py-3 px-3">Roll Number</th>
                <th className="py-3 px-3 text-amber-400 font-bold">Total Gems (Points)</th>
                <th className="py-3 px-3">Attendance %</th>
                <th className="py-3 px-3">Tier</th>
                <th className="py-3 px-3">Lab Submissions</th>
                <th className="py-3 px-3 text-right">Faculty Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredStudents.map((student, idx) => {
                const rankNumber = idx + 1;
                const isTop1 = rankNumber === 1;
                const isTop3 = rankNumber <= 3;
                const isAtRisk = student.attendancePercent < 75 || student.gems < 100;

                return (
                  <tr
                    key={student.id}
                    className={`transition hover:bg-slate-800/40 ${
                      isTop1 ? 'bg-amber-950/20' : isAtRisk ? 'bg-rose-950/10' : ''
                    }`}
                  >
                    {/* Rank Badge */}
                    <td className="py-3 px-3 font-mono font-bold">
                      {isTop1 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-500 text-slate-950 font-black shadow">
                          #1
                        </span>
                      ) : rankNumber === 2 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-slate-400 text-slate-950 font-black">
                          #2
                        </span>
                      ) : rankNumber === 3 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-orange-500 text-slate-950 font-black">
                          #3
                        </span>
                      ) : (
                        <span className="text-slate-400 ml-2">#{rankNumber}</span>
                      )}
                    </td>

                    {/* Student Info */}
                    <td className="py-3 px-3 text-white font-semibold flex items-center gap-2.5">
                      <img
                        src={student.avatar}
                        alt={student.name}
                        className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-700"
                      />
                      <span>{student.name}</span>
                    </td>

                    {/* Division */}
                    <td className="py-3 px-3 font-mono">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          student.division === 'A'
                            ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                            : 'bg-sky-950 text-sky-300 border border-sky-800'
                        }`}
                      >
                        Div {student.division}
                      </span>
                    </td>

                    {/* Roll Number */}
                    <td className="py-3 px-3 font-mono text-slate-400">
                      {student.rollNumber}
                    </td>

                    {/* Total Gems (Ordered Column) */}
                    <td className="py-3 px-3 font-mono text-sm font-black text-amber-300">
                      <span className="inline-flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        {student.gems}
                      </span>
                    </td>

                    {/* Attendance Health */}
                    <td className="py-3 px-3 font-mono">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold inline-flex items-center gap-1 ${
                          student.attendancePercent >= 85
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : student.attendancePercent >= 75
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {student.attendancePercent < 75 && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                        {student.attendancePercent}%
                      </span>
                    </td>

                    {/* Tier */}
                    <td className="py-3 px-3 font-mono text-[11px]">
                      <span className="text-slate-300">{student.tier}</span>
                    </td>

                    {/* Labs Submitted */}
                    <td className="py-3 px-3 font-mono text-xs text-slate-400">
                      {student.labsSubmitted} / {student.totalLabs} Labs
                    </td>

                    {/* Quick Faculty Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleGiveBonus(student)}
                          className="px-2.5 py-1 rounded-lg bg-amber-950/70 hover:bg-amber-900 border border-amber-700/60 text-amber-300 text-[11px] font-semibold transition"
                          title="Award +25 Bonus Gems for Excellence"
                        >
                          +25 Gems
                        </button>

                        {isAtRisk && (
                          <button
                            onClick={() => handleSendNotice(student)}
                            className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-300 text-[11px] font-semibold transition"
                            title="Send Attendance Notice"
                          >
                            Warn
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
