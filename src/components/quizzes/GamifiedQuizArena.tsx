import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { QuizQuestion, UserProfile } from '../../types';
import { INITIAL_QUIZ_QUESTIONS, WEEKLY_MEGA_TEST_QUESTIONS, MOCK_STUDENT_ANALYTICS, MOCK_DIVISION_ATTENDANCE_COMPARISON } from '../../data/mockData';
import { playSuccessChime, playWarningBuzzer } from '../../utils/audio';
import { triggerGrandCelebration, triggerQuickSparkle } from '../../utils/confetti';
import {
  Trophy,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingUp,
  Award,
  Crown,
  Flame,
  ArrowRight,
  RotateCcw,
  BarChart2,
  BookCheck,
  Zap
} from 'lucide-react';

interface QuizArenaProps {
  currentUser: UserProfile;
  onUpdateUserGems: (userId: string, delta: number) => void;
  defaultMode?: 'arena' | 'mega_test' | 'analytics';
}

export const GamifiedQuizArena: React.FC<QuizArenaProps> = ({
  currentUser,
  onUpdateUserGems,
  defaultMode = 'arena'
}) => {
  const [activeMode, setActiveMode] = useState<'arena' | 'mega_test' | 'analytics'>(defaultMode);

  // Quiz Engine State
  const [quizSubject, setQuizSubject] = useState<'ALL' | 'DSA' | 'OS' | 'DBMS'>('ALL');
  const [activeQuestionList, setActiveQuestionList] = useState<QuizQuestion[]>(INITIAL_QUIZ_QUESTIONS.slice(0, 5));
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [totalEarnedGems, setTotalEarnedGems] = useState<number>(0);
  const [isQuizCompleted, setIsQuizCompleted] = useState<boolean>(false);

  // Mega Test active status
  const [isMegaTestActive, setIsMegaTestActive] = useState<boolean>(false);

  // Start Daily 5-Question Quiz
  const startDailyQuiz = (subject: 'ALL' | 'DSA' | 'OS' | 'DBMS') => {
    setQuizSubject(subject);
    setIsMegaTestActive(false);
    let questions = INITIAL_QUIZ_QUESTIONS;
    if (subject !== 'ALL') {
      questions = INITIAL_QUIZ_QUESTIONS.filter((q) => q.subject === subject);
      if (questions.length < 5) {
        questions = [...questions, ...WEEKLY_MEGA_TEST_QUESTIONS.filter((q) => q.subject === subject)];
      }
    }
    setActiveQuestionList(questions.slice(0, 5));
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setTotalEarnedGems(0);
    setIsQuizCompleted(false);
    setActiveMode('arena');
  };

  // Start 15-Question Weekly Mega Test
  const startWeeklyMegaTest = () => {
    setIsMegaTestActive(true);
    setActiveQuestionList(WEEKLY_MEGA_TEST_QUESTIONS.slice(0, 15));
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setTotalEarnedGems(0);
    setIsQuizCompleted(false);
    setActiveMode('arena');
  };

  // Submit Answer & Evaluate
  const handleSubmitAnswer = () => {
    if (selectedAnswer === null || isAnswerSubmitted) return;

    const currentQ = activeQuestionList[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQ.correctAnswer;

    setIsAnswerSubmitted(true);

    if (isCorrect) {
      playSuccessChime();
      triggerQuickSparkle();
      const points = currentQ.points;
      setScore((s) => s + 1);
      setTotalEarnedGems((g) => g + points);
    } else {
      playWarningBuzzer();
    }
  };

  // Advance to Next Question
  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < activeQuestionList.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
    } else {
      // Completed!
      setIsQuizCompleted(true);
      triggerGrandCelebration(3500);
      onUpdateUserGems(currentUser.id, totalEarnedGems);
    }
  };

  // Dynamic Tier Calculation
  const calculateTier = (correctCount: number, total: number) => {
    const percentage = (correctCount / total) * 100;
    if (percentage >= 90) return { name: 'Grandmaster', color: 'text-amber-300', bg: 'bg-amber-950/80 border-amber-600', icon: Crown };
    if (percentage >= 80) return { name: 'Diamond Tier', color: 'text-sky-300', bg: 'bg-sky-950/80 border-sky-600', icon: Sparkles };
    if (percentage >= 70) return { name: 'Gold Tier', color: 'text-yellow-300', bg: 'bg-yellow-950/80 border-yellow-600', icon: Award };
    if (percentage >= 50) return { name: 'Silver Tier', color: 'text-slate-300', bg: 'bg-slate-800 border-slate-600', icon: Trophy };
    return { name: 'Bronze Tier', color: 'text-orange-400', bg: 'bg-orange-950/80 border-orange-700', icon: Zap };
  };

  const currentQ = activeQuestionList[currentQuestionIndex];
  const finalTier = calculateTier(score, activeQuestionList.length);
  const FinalTierIcon = finalTier.icon;

  return (
    <div className="space-y-6">
      {/* Top Header & Mode Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400">
              <Trophy className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Gamified Quizzes & Weekly Mega Test
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Adaptive 5-question daily practice sprints, 15-question Weekly Mega Tests with dynamic tier ranks, and Recharts performance analytics.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMode('arena')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeMode === 'arena'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Quiz Arena
          </button>
          <button
            onClick={() => setActiveMode('analytics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
              activeMode === 'analytics'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Performance Analytics</span>
          </button>
        </div>
      </div>

      {activeMode === 'arena' && (
        <div className="space-y-6">
          {/* Quick Start Banners: Daily vs Weekly Mega Test */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Daily Adaptive Quiz Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                    Daily Adaptive Sprint
                  </span>
                  <h3 className="text-base font-bold text-white mt-1.5">
                    5-Question Knowledge Check
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Earn up to +60 Gems & strengthen your daily streak.
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
              </div>

              {/* Subject selectors */}
              <div className="flex gap-1.5 mt-4">
                {(['ALL', 'DSA', 'OS', 'DBMS'] as const).map((sub) => (
                  <button
                    key={sub}
                    onClick={() => startDailyQuiz(sub)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-mono font-semibold bg-slate-950 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-800 transition"
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            {/* Weekly Mega Test Box */}
            <div className="bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-900 border-2 border-indigo-500/40 rounded-2xl p-5 shadow-xl relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold flex items-center gap-1 w-fit">
                    <Crown className="w-3 h-3 text-amber-400" />
                    Weekly Mega Championship
                  </span>
                  <h3 className="text-base font-bold text-white mt-1.5">
                    15-Question Comprehensive Test
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Multi-subject deep challenge (DSA, OS, DBMS). Unlocks Grandmaster Tier & +250 Gems.
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center">
                  <Trophy className="w-5 h-5" />
                </div>
              </div>

              <button
                onClick={startWeeklyMegaTest}
                className="w-full mt-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-bold text-xs shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-1.5"
              >
                <Flame className="w-4 h-4 text-slate-950" />
                <span>Launch 15-Question Mega Test</span>
              </button>
            </div>
          </div>

          {/* Active Quiz Card / Results Screen */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            {!isQuizCompleted ? (
              <div className="space-y-6">
                {/* Progress bar and badges */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                      {currentQ.subject}
                    </span>
                    <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded ${
                      currentQ.difficulty === 'Easy' ? 'bg-emerald-950 text-emerald-300' :
                      currentQ.difficulty === 'Medium' ? 'bg-amber-950 text-amber-300' : 'bg-rose-950 text-rose-300'
                    }`}>
                      {currentQ.difficulty}
                    </span>
                    <span className="text-xs text-amber-300 font-mono font-semibold">
                      +{currentQ.points} Gems
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <span>Question</span>
                    <span className="text-white font-bold">{currentQuestionIndex + 1}</span>
                    <span>of</span>
                    <span>{activeQuestionList.length}</span>
                  </div>
                </div>

                {/* Progress Track */}
                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-300"
                    style={{
                      width: `${((currentQuestionIndex + 1) / activeQuestionList.length) * 100}%`
                    }}
                  />
                </div>

                {/* Question Statement */}
                <div className="py-2">
                  <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                    {currentQ.question}
                  </h3>
                </div>

                {/* Options List */}
                <div className="space-y-2.5">
                  {currentQ.options.map((opt, idx) => {
                    const isSelected = selectedAnswer === idx;
                    const isCorrect = currentQ.correctAnswer === idx;

                    let optionStyle = 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700';

                    if (isAnswerSubmitted) {
                      if (isCorrect) {
                        optionStyle = 'bg-emerald-950/80 border-emerald-600 text-emerald-200 shadow-md shadow-emerald-900/30';
                      } else if (isSelected && !isCorrect) {
                        optionStyle = 'bg-rose-950/80 border-rose-600 text-rose-200';
                      }
                    } else if (isSelected) {
                      optionStyle = 'bg-indigo-950/60 border-indigo-500 text-indigo-100 ring-1 ring-indigo-500';
                    }

                    return (
                      <button
                        key={idx}
                        disabled={isAnswerSubmitted}
                        onClick={() => setSelectedAnswer(idx)}
                        className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm font-medium transition flex items-center justify-between gap-3 ${optionStyle}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-slate-800 font-mono text-xs flex items-center justify-center font-bold text-slate-300 shrink-0">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span>{opt}</span>
                        </div>

                        {isAnswerSubmitted && isCorrect && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        )}
                        {isAnswerSubmitted && isSelected && !isCorrect && (
                          <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Detailed Explanation upon submission */}
                {isAnswerSubmitted && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs animate-in fade-in slide-in-from-top-2">
                    <div className="font-bold text-white flex items-center gap-1.5 mb-1">
                      <HelpCircle className="w-4 h-4 text-indigo-400" />
                      Academic Theorem & Verification Explanation:
                    </div>
                    <p className="text-slate-300 leading-relaxed font-mono">
                      {currentQ.explanation}
                    </p>
                  </div>
                )}

                {/* Footer Action Buttons */}
                <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                  <div className="text-xs font-mono text-slate-400">
                    Live Score: <span className="text-emerald-400 font-bold">{score}</span> / {activeQuestionList.length} • Earned: <span className="text-amber-400 font-bold">+{totalEarnedGems} Gems</span>
                  </div>

                  <div>
                    {!isAnswerSubmitted ? (
                      <button
                        onClick={handleSubmitAnswer}
                        disabled={selectedAnswer === null}
                        className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-600/30 transition"
                      >
                        Check Answer
                      </button>
                    ) : (
                      <button
                        onClick={handleNextQuestion}
                        className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition"
                      >
                        <span>{currentQuestionIndex + 1 < activeQuestionList.length ? 'Next Question' : 'Complete Assessment'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* GRAND CELEBRATION RESULTS BOX */
              <div className="text-center py-8 space-y-5 animate-in zoom-in-95">
                <div className={`w-20 h-20 rounded-2xl mx-auto flex items-center justify-center border-2 ${finalTier.bg}`}>
                  <FinalTierIcon className={`w-10 h-10 ${finalTier.color}`} />
                </div>

                <div>
                  <span className={`text-xs font-mono font-bold uppercase tracking-wider ${finalTier.color}`}>
                    {finalTier.name} Achieved!
                  </span>
                  <h3 className="text-2xl font-black text-white mt-1">
                    {isMegaTestActive ? 'Weekly Mega Test Completed!' : 'Daily Practice Sprint Mastered!'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Outstanding engineering precision. Canvas-confetti celebration fireworks triggered!
                  </p>
                </div>

                {/* Stats Summary Badges */}
                <div className="flex items-center justify-center gap-4 max-w-sm mx-auto">
                  <div className="flex-1 bg-slate-950 border border-slate-800 p-3 rounded-xl">
                    <span className="text-[10px] text-slate-400 block uppercase font-mono">Accuracy</span>
                    <span className="text-lg font-bold text-white">
                      {Math.round((score / activeQuestionList.length) * 100)}%
                    </span>
                  </div>

                  <div className="flex-1 bg-slate-950 border border-slate-800 p-3 rounded-xl">
                    <span className="text-[10px] text-slate-400 block uppercase font-mono">Gems Awarded</span>
                    <span className="text-lg font-bold text-amber-400 flex items-center justify-center gap-1">
                      <Sparkles className="w-4 h-4" /> +{totalEarnedGems}
                    </span>
                  </div>

                  <div className="flex-1 bg-slate-950 border border-slate-800 p-3 rounded-xl">
                    <span className="text-[10px] text-slate-400 block uppercase font-mono">Rank Tier</span>
                    <span className={`text-sm font-bold truncate block ${finalTier.color}`}>
                      {finalTier.name.split(' ')[0]}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 pt-4">
                  <button
                    onClick={() => startDailyQuiz('ALL')}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Try Another Practice</span>
                  </button>
                  <button
                    onClick={() => setActiveMode('analytics')}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>View Performance Trends</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RECHARTS PERFORMANCE ANALYTICS VIEW */}
      {activeMode === 'analytics' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Chart 1: Daily Quiz Score Trend (Area Chart) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-white text-sm">7-Day Score Progression & Mastery Curve</h3>
                  <p className="text-xs text-slate-400">Adaptive quiz test scores evaluated daily across subjects</p>
                </div>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800">
                +14% Growth this week
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_STUDENT_ANALYTICS} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" domain={[60, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#scoreColor)" name="Quiz Score %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Daily Gem Accumulation (Bar Chart) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="font-bold text-white text-sm">Gems Accrued by Day</h3>
                    <p className="text-xs text-slate-400">Total gamified rewards credited from quizzes & punctuality</p>
                  </div>
                </div>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_STUDENT_ANALYTICS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                    />
                    <Bar dataKey="gems" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Gems Earned" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Division Comparison Breakdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-sky-400" />
                  <div>
                    <h3 className="font-bold text-white text-sm">Division A vs Division B Attendance Rate</h3>
                    <p className="text-xs text-slate-400">Real-time attendance comparison by engineering subject</p>
                  </div>
                </div>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_DIVISION_ATTENDANCE_COMPARISON} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="course" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" domain={[70, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="divA" fill="#6366f1" radius={[4, 4, 0, 0]} name="Div A %" />
                    <Bar dataKey="divB" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Div B %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
