import React, { useState } from 'react';
import { UserProfile, Assignment, Submission, Division } from '../../types';
import { IMAGES_2D, IMAGES_3D, handleImageError, PUBLIC_IMAGES } from '../../assets/images';
import { playSuccessChime, playWarningBuzzer } from '../../utils/audio';
import { triggerGrandCelebration, triggerQuickSparkle } from '../../utils/confetti';
import {
  FileText,
  Plus,
  UploadCloud,
  CheckCircle,
  Clock,
  Award,
  ChevronDown,
  ChevronUp,
  Code2,
  Cpu,
  FileCheck2,
  Send,
  MessageSquare,
  AlertCircle,
  Sparkles,
  Paperclip,
  Link as LinkIcon,
  X,
  RotateCcw,
  User,
  GraduationCap,
  ExternalLink,
  CheckCircle2,
  FileUp,
  CornerDownRight,
  Bell
} from 'lucide-react';

interface AssignmentsWorkstationProps {
  currentUser: UserProfile;
  assignments: Assignment[];
  submissions: Submission[];
  onAddAssignment: (assignment: Assignment) => void;
  onSubmitLab: (submission: Submission) => void;
  onGradeSubmission: (submissionId: string, marks: number, feedback: string, graderName: string) => void;
  onUnsubmitLab?: (submissionId: string) => void;
  onTriggerDeadlineReminder?: (assignment: Assignment) => void;
}

export const AssignmentsWorkstation: React.FC<AssignmentsWorkstationProps> = ({
  currentUser,
  assignments,
  submissions,
  onAddAssignment,
  onSubmitLab,
  onGradeSubmission,
  onUnsubmitLab,
  onTriggerDeadlineReminder
}) => {
  // Active selected assignment tab/card
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>(assignments[0]?.id || '');

  // Faculty Inline Publish Workstation state
  const [isPublishBoxOpen, setIsPublishBoxOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('CS302');
  const [newCourseName, setNewCourseName] = useState('Compiler Design');
  const [newDivision, setNewDivision] = useState<Division | 'ALL'>('ALL');
  const [newDeadlineDays, setNewDeadlineDays] = useState('4');
  const [newTotalMarks, setNewTotalMarks] = useState('30');
  const [newInstructions, setNewInstructions] = useState('');

  // Classroom-Style "Your Work" Student Submission State
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: string; type: string }[]>([
    { name: `${currentUser.name.replace(/\s+/g, '_')}_Lab_Report.pdf`, size: '3.4 MB', type: 'application/pdf' }
  ]);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [studentCodeSnippet, setStudentCodeSnippet] = useState('');
  const [execTimeMs, setExecTimeMs] = useState('14.8');
  const [memoryKb, setMemoryKb] = useState('3420');
  const [testCasesPassed, setTestCasesPassed] = useState('18');
  const [totalTestCases, setTotalTestCases] = useState('18');
  const [privateComment, setPrivateComment] = useState('');
  const [studentPrivateComments, setStudentPrivateComments] = useState<{ id: string; sender: string; text: string; time: string }[]>([]);

  // Faculty Grading Console State
  const [activeGradingSubId, setActiveGradingSubId] = useState<string | null>(null);
  const [gradingMarks, setGradingMarks] = useState<number>(28);
  const [gradingFeedback, setGradingFeedback] = useState<string>('');
  const [submissionFilter, setSubmissionFilter] = useState<'ALL' | 'turned_in' | 'graded'>('ALL');

  // Currently active assignment
  const currentAssignment = assignments.find((a) => a.id === selectedAssignmentId) || assignments[0];

  // Current student's submission for this assignment
  const myCurrentSubmission = submissions.find(
    (s) => s.assignmentId === currentAssignment?.id && s.studentId === currentUser.id
  );

  const isTurnedIn = !!myCurrentSubmission;
  const isGraded = myCurrentSubmission?.status === 'graded';

  // Faculty publish new lab
  const handlePublishLab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newLab: Assignment = {
      id: `assign-${Date.now()}`,
      title: newTitle,
      courseCode: newCourseCode,
      courseName: newCourseName,
      division: newDivision,
      facultyId: currentUser.id,
      facultyName: currentUser.name,
      deadline: `In ${newDeadlineDays} Days`,
      totalMarks: Number(newTotalMarks) || 30,
      instructions: newInstructions || 'Follow university lab manual guidelines and submit verified benchmarks in your report.',
      deliverables: ['Comprehensive Lab Report (.pdf)', 'Source Code File (.cpp / .py)', 'Execution Benchmarks'],
      submissionCount: 0,
      totalStudents: newDivision === 'ALL' ? 120 : 60
    };

    onAddAssignment(newLab);
    setSelectedAssignmentId(newLab.id);
    setIsPublishBoxOpen(false);
    setNewTitle('');
    setNewInstructions('');
  };

  // Student Classroom Online "Turn In" Action
  const handleTurnIn = () => {
    if (!attachedFiles.length && !studentCodeSnippet.trim()) {
      playWarningBuzzer();
      return;
    }

    const mainFile = attachedFiles[0] || { name: 'Lab_Report.pdf', size: '2.5 MB' };

    const newSub: Submission = {
      id: `sub-${Date.now()}`,
      assignmentId: currentAssignment.id,
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentDivision: currentUser.division || 'A',
      fileName: mainFile.name,
      fileSize: mainFile.size,
      submittedAt: 'Just now (Turned in online)',
      benchmarkStats: {
        executionTimeMs: parseFloat(execTimeMs) || 14.8,
        memoryKb: parseInt(memoryKb, 10) || 3420,
        testCasesPassed: parseInt(testCasesPassed, 10) || 18,
        totalTestCases: parseInt(totalTestCases, 10) || 18
      },
      codeSnippet: studentCodeSnippet || '// Verified implementation\nint main() {\n    return 0;\n}',
      status: 'pending'
    };

    onSubmitLab(newSub);
    playSuccessChime();
    triggerGrandCelebration(2500);

    if (privateComment.trim()) {
      setStudentPrivateComments((prev) => [
        ...prev,
        { id: `cmt-${Date.now()}`, sender: currentUser.name, text: privateComment.trim(), time: 'Just now' }
      ]);
      setPrivateComment('');
    }
  };

  // Student Classroom "Unsubmit" Action
  const handleUnsubmit = () => {
    if (onUnsubmitLab && myCurrentSubmission) {
      onUnsubmitLab(myCurrentSubmission.id);
    }
    playSuccessChime();
  };

  // Student Add File Attachment
  const handleAddFile = (fileName: string, fileSize: string) => {
    setAttachedFiles((prev) => [...prev, { name: fileName, size: fileSize, type: 'application/pdf' }]);
    setIsAddMenuOpen(false);
    playSuccessChime();
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Faculty return grade & private feedback
  const handleFacultyReturn = (subId: string) => {
    onGradeSubmission(subId, gradingMarks, gradingFeedback, currentUser.name);
    setActiveGradingSubId(null);
    playSuccessChime();
    triggerQuickSparkle();
  };

  // Submissions for current lab
  const currentLabSubmissions = submissions.filter((s) => s.assignmentId === currentAssignment?.id);
  const filteredSubmissions = currentLabSubmissions.filter((s) => {
    if (submissionFilter === 'turned_in') return s.status === 'pending';
    if (submissionFilter === 'graded') return s.status === 'graded';
    return true;
  });

  // Find any assignment due within 24 hours (e.g. deadline contains 1 Day, Tomorrow, 24h)
  const urgent24hAssignment = assignments.find(
    (a) =>
      a.deadline.toLowerCase().includes('1 day') ||
      a.deadline.toLowerCase().includes('tomorrow') ||
      a.deadline.toLowerCase().includes('24h') ||
      a.deadline.toLowerCase().includes('today')
  ) || assignments[2];

  const isUrgentSubmitted = submissions.some(
    (s) => s.assignmentId === urgent24hAssignment?.id && s.studentId === currentUser.id
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400">
              <GraduationCap className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {currentUser.role === 'faculty' ? 'Faculty Lab Assignments & Grading Console' : 'Classroom Online Assignment Submissions'}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            {currentUser.role === 'faculty'
              ? 'Publish course lab manuals, review online student report submissions, evaluate code benchmarks, and return grades.'
              : 'Google Classroom-style online workstation. Attach your PDF reports, inspect deliverables, write private comments, and click "Turn In".'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* 2D Vector Lab Submission Station Asset */}
          <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-700 shadow-sm bg-slate-950 shrink-0 transform hover:scale-105 transition" title="2D Lab Submission Terminal">
            <img
              src={IMAGES_2D.labSubmission}
              alt="Lab Terminal 2D Vector"
              className="w-full h-full object-cover"
              onError={(e) => handleImageError(e, PUBLIC_IMAGES.labSubmission)}
            />
          </div>

          {currentUser.role === 'faculty' && (
            <button
              onClick={() => setIsPublishBoxOpen(!isPublishBoxOpen)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
            >
              <Plus className="w-4 h-4" />
              <span>{isPublishBoxOpen ? 'Collapse Publish Box' : 'Publish New Lab Assignment'}</span>
              {isPublishBoxOpen ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
            </button>
          )}
        </div>
      </div>

      {/* 24-HOUR DEADLINE ALERT NOTIFICATION BANNER (Real-Time Countdown & Broadcast) */}
      {urgent24hAssignment && (
        <div className={`p-4 sm:p-5 rounded-3xl border transition relative overflow-hidden ${
          isUrgentSubmitted
            ? 'bg-emerald-950/20 border-emerald-800/40'
            : 'bg-gradient-to-r from-rose-950/70 via-slate-900 to-amber-950/40 border-rose-500/70 shadow-lg'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-rose-500/80 shadow-lg shadow-rose-600/30 bg-slate-950">
                  <img
                    src={IMAGES_2D.labSubmission}
                    alt="Lab Terminal 2D Vector"
                    className="w-full h-full object-cover"
                    onError={(e) => handleImageError(e, PUBLIC_IMAGES.labSubmission)}
                  />
                </div>
                <div className={`absolute -bottom-1 -right-1 p-1 rounded-full text-white shadow ${
                  isUrgentSubmitted ? 'bg-emerald-600' : 'bg-rose-600 animate-pulse'
                }`}>
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`text-[10px] font-mono uppercase font-black px-2.5 py-0.5 rounded-full border ${
                    isUrgentSubmitted
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700/60'
                      : 'bg-rose-900/80 text-rose-200 border-rose-400 animate-pulse'
                  }`}>
                    {isUrgentSubmitted ? '✓ Turned In Ahead of Cutoff' : '🚨 24-HOUR DEADLINE WARNING (< 24 HRS LEFT)'}
                  </span>
                  <span className="text-xs font-mono text-rose-300 font-bold">
                    Due {urgent24hAssignment.deadline}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-white">
                  {urgent24hAssignment.title}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {isUrgentSubmitted
                    ? 'Your lab report has been submitted online. You can view or unsubmit before cutoff.'
                    : 'Final 24 hours to submit your lab report and benchmark stats! System will trigger urgent notification alert.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {!isUrgentSubmitted && (
                <button
                  onClick={() => {
                    setSelectedAssignmentId(urgent24hAssignment.id);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-1.5 transition"
                >
                  <span>Turn In Now</span>
                  <CornerDownRight className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Live 24h Alert Simulator Button */}
              {onTriggerDeadlineReminder && (
                <button
                  onClick={() => {
                    onTriggerDeadlineReminder(urgent24hAssignment);
                  }}
                  title="Simulate immediate 24h deadline reminder notification with audio chime and toast"
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-rose-500/50 text-rose-300 text-xs font-mono font-semibold flex items-center gap-1.5 shadow transition"
                >
                  <Bell className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
                  <span>Test 24h Alert Ping</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* INLINE FACULTY PUBLISH WORKSTATION BOX (Zero Modals) */}
      {isPublishBoxOpen && currentUser.role === 'faculty' && (
        <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-2xl p-6 shadow-2xl animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-white text-sm">
                Create & Publish Course Lab Assignment
              </h3>
            </div>
            <span className="text-[10px] font-mono uppercase bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800">
              Google Classroom Ingest
            </span>
          </div>

          <form onSubmit={handlePublishLab} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                  Assignment Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lab 6: Red-Black Tree Balanced Invariant Engine"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                  Course Subject
                </label>
                <select
                  value={`${newCourseCode}|${newCourseName}`}
                  onChange={(e) => {
                    const [code, name] = e.target.value.split('|');
                    setNewCourseCode(code);
                    setNewCourseName(name);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                >
                  <option value="CS302|Compiler Design">CS302 Compiler Design</option>
                  <option value="CS304|Operating Systems">CS304 Operating Systems</option>
                  <option value="CS305|DBMS">CS305 DBMS</option>
                  <option value="CS306|Computer Networks">CS306 Computer Networks</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                  Target Division
                </label>
                <div className="flex gap-2">
                  {(['ALL', 'A', 'B'] as (Division | 'ALL')[]).map((div) => (
                    <button
                      key={div}
                      type="button"
                      onClick={() => setNewDivision(div)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition font-mono ${
                        newDivision === div
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-950 border border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {div === 'ALL' ? 'Both A & B' : `Div ${div}`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                  Due In (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={newDeadlineDays}
                  onChange={(e) => setNewDeadlineDays(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                  Total Points / Marks
                </label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={newTotalMarks}
                  onChange={(e) => setNewTotalMarks(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                Instructions & Deliverables
              </label>
              <textarea
                rows={3}
                placeholder="Specify lab instructions, memory limits, and expected deliverables..."
                value={newInstructions}
                onChange={(e) => setNewInstructions(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPublishBoxOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Assign to Students</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lab Assignment Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {assignments.map((assignment) => {
          const isSelected = assignment.id === selectedAssignmentId;
          const mySub = submissions.find(
            (s) => s.assignmentId === assignment.id && s.studentId === currentUser.id
          );

          return (
            <button
              key={assignment.id}
              onClick={() => setSelectedAssignmentId(assignment.id)}
              className={`px-4 py-3 rounded-2xl border text-left transition flex items-center gap-3 shrink-0 ${
                isSelected
                  ? 'bg-slate-900 border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-950/80 border border-indigo-800 flex items-center justify-center text-indigo-400 font-bold font-mono text-xs">
                {assignment.courseCode}
              </div>
              <div>
                <div className="text-xs font-bold text-white max-w-[200px] truncate">
                  {assignment.title}
                </div>
                <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                  <span>{assignment.deadline}</span>
                  {currentUser.role === 'student' && (
                    <span className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                      mySub?.status === 'graded'
                        ? 'bg-emerald-950 text-emerald-300'
                        : mySub
                        ? 'bg-sky-950 text-sky-300'
                        : 'bg-slate-800 text-amber-300'
                    }`}>
                      {mySub?.status === 'graded' ? `${mySub.obtainedMarks}/${assignment.totalMarks}` : mySub ? 'Turned In' : 'Assigned'}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* GOOGLE CLASSROOM-STYLE MAIN WORKSTATION (Dual Column Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Assignment Details & Lab Manual Instructions */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Header Row */}
          <div className="border-b border-slate-800 pb-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800">
                {currentAssignment.courseCode} • {currentAssignment.courseName}
              </span>
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-300 font-bold">Due {currentAssignment.deadline}</span>
                </div>
                {currentUser.role === 'faculty' && onTriggerDeadlineReminder && (
                  <button
                    onClick={() => onTriggerDeadlineReminder(currentAssignment)}
                    className="ml-2 px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-600/70 text-rose-200 text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-md shadow-rose-950/40 transition"
                    title="Broadcast 24-hour deadline reminder alert to all enrolled students"
                  >
                    <Bell className="w-3 h-3 text-rose-400 animate-pulse" />
                    <span>Broadcast 24h Reminder</span>
                  </button>
                )}
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {currentAssignment.title}
            </h1>

            <div className="flex items-center justify-between text-xs text-slate-400 mt-2 font-mono">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>Instructor: {currentAssignment.facultyName}</span>
                <span>•</span>
                <span>Div: {currentAssignment.division}</span>
              </div>
              <span className="text-slate-300 font-bold">{currentAssignment.totalMarks} Points</span>
            </div>
          </div>

          {/* Instructions Body */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-2">
              Lab Instructions & Specifications
            </h3>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line bg-slate-950/70 p-4 rounded-2xl border border-slate-800 font-mono">
              {currentAssignment.instructions}
            </p>
          </div>

          {/* Deliverables Chips */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-2">
              Required Deliverables
            </h3>
            <div className="flex flex-wrap gap-2">
              {currentAssignment.deliverables.map((del, idx) => (
                <div
                  key={idx}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono flex items-center gap-2"
                >
                  <FileCheck2 className="w-4 h-4 text-emerald-400" />
                  <span>{del}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reference Materials / Attachment Preview */}
          <div className="border-t border-slate-800 pt-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-3">
              Course Reference Material
            </h3>
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-400 flex items-center justify-center font-bold text-xs font-mono">
                  PDF
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    {currentAssignment.courseName}_Lab_Manual_Specification.pdf
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">2.8 MB • Verified Official Manual</span>
                </div>
              </div>

              <span className="text-xs text-indigo-400 font-mono font-semibold">
                Reference Material
              </span>
            </div>
          </div>

          {/* FACULTY SUBMISSIONS MANAGEMENT CONSOLE (For Teachers) */}
          {currentUser.role === 'faculty' && (
            <div className="border-t border-slate-800 pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Student Submissions ({currentLabSubmissions.length})
                  </h3>
                  <p className="text-xs text-slate-400">Classroom evaluation and grade return queue</p>
                </div>

                <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
                  <button
                    onClick={() => setSubmissionFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg ${submissionFilter === 'ALL' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'}`}
                  >
                    All ({currentLabSubmissions.length})
                  </button>
                  <button
                    onClick={() => setSubmissionFilter('turned_in')}
                    className={`px-2.5 py-1 rounded-lg ${submissionFilter === 'turned_in' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400'}`}
                  >
                    Turned In ({currentLabSubmissions.filter((s) => s.status === 'pending').length})
                  </button>
                  <button
                    onClick={() => setSubmissionFilter('graded')}
                    className={`px-2.5 py-1 rounded-lg ${submissionFilter === 'graded' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400'}`}
                  >
                    Graded ({currentLabSubmissions.filter((s) => s.status === 'graded').length})
                  </button>
                </div>
              </div>

              {filteredSubmissions.length === 0 ? (
                <div className="text-xs text-slate-500 italic p-4 text-center bg-slate-950/60 rounded-2xl">
                  No submissions in this filter category yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSubmissions.map((sub) => {
                    const isGradingNow = activeGradingSubId === sub.id;

                    return (
                      <div
                        key={sub.id}
                        className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 transition hover:border-slate-700"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{sub.studentName}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300">
                                Div {sub.studentDivision}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Submitted {sub.submittedAt}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-300 mt-1">
                              <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                                {sub.fileName} ({sub.fileSize})
                              </span>
                              <span className="text-[11px] font-mono text-emerald-400">
                                {sub.benchmarkStats.executionTimeMs}ms • {sub.benchmarkStats.memoryKb}KB • {sub.benchmarkStats.testCasesPassed}/{sub.benchmarkStats.totalTestCases} Tests
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {sub.status === 'graded' ? (
                              <span className="px-3 py-1 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-300 font-mono text-xs font-bold">
                                {sub.obtainedMarks} / {currentAssignment.totalMarks} Points
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-xl bg-sky-950/80 border border-sky-700 text-sky-300 font-mono text-xs font-bold">
                                Turned In
                              </span>
                            )}

                            <button
                              onClick={() => {
                                if (isGradingNow) {
                                  setActiveGradingSubId(null);
                                } else {
                                  setActiveGradingSubId(sub.id);
                                  setGradingMarks(sub.obtainedMarks || 28);
                                  setGradingFeedback(sub.facultyFeedback || 'Good performance and verified benchmarks.');
                                }
                              }}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
                            >
                              {isGradingNow ? 'Close Grading' : sub.status === 'graded' ? 'Edit Grade' : 'Grade & Return'}
                            </button>
                          </div>
                        </div>

                        {/* Grading console */}
                        {isGradingNow && (
                          <div className="mt-3 p-4 rounded-xl bg-slate-900 border-2 border-indigo-500/50 space-y-3 animate-in fade-in">
                            <div className="flex items-center justify-between text-xs font-mono font-bold text-white">
                              <span>Grade Student Work & Return</span>
                              <span className="text-slate-400">Student: {sub.studentName}</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                              <div>
                                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                                  Points (Max: {currentAssignment.totalMarks})
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max={currentAssignment.totalMarks}
                                  value={gradingMarks}
                                  onChange={(e) => setGradingMarks(Number(e.target.value))}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-sm font-bold"
                                />
                              </div>

                              <div className="sm:col-span-3">
                                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                                  Private Feedback to Student
                                </label>
                                <input
                                  type="text"
                                  value={gradingFeedback}
                                  onChange={(e) => setGradingFeedback(e.target.value)}
                                  placeholder="Write feedback returned directly to student's Classroom card..."
                                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs"
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setActiveGradingSubId(null)}
                                className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleFacultyReturn(sub.id)}
                                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 shadow-md shadow-emerald-600/30"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Return Grade</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: GOOGLE CLASSROOM-STYLE "YOUR WORK" CARD (FOR STUDENTS) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            {/* Header: Title and Status Badge */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Your Work</h3>
                <span className="text-[10px] font-mono text-slate-400">Classroom Online Submission</span>
              </div>

              {/* Status Badge */}
              <span
                className={`text-xs font-mono uppercase font-black px-3 py-1 rounded-full border shadow-sm ${
                  isGraded
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                    : isTurnedIn
                    ? 'bg-sky-950 text-sky-300 border-sky-600'
                    : 'bg-indigo-950 text-indigo-300 border-indigo-700'
                }`}
              >
                {isGraded ? 'Graded' : isTurnedIn ? 'Turned In' : 'Assigned'}
              </span>
            </div>

            {/* If Graded: Show Points Awarded Badge */}
            {isGraded && myCurrentSubmission && (
              <div className="mb-4 p-4 rounded-2xl bg-emerald-950/60 border border-emerald-700/60 text-center animate-in fade-in">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                  Grade Returned
                </span>
                <div className="text-2xl font-black text-white font-mono mt-0.5">
                  {myCurrentSubmission.obtainedMarks} <span className="text-sm text-slate-400">/ {currentAssignment.totalMarks} Points</span>
                </div>
                {myCurrentSubmission.facultyFeedback && (
                  <p className="text-xs text-emerald-200 mt-2 bg-slate-950/80 p-2.5 rounded-xl border border-emerald-800/40 text-left">
                    <span className="font-bold text-white block mb-0.5">Teacher feedback:</span>
                    {myCurrentSubmission.facultyFeedback}
                  </p>
                )}
              </div>
            )}

            {/* Attached Files List (Classroom file chips) */}
            <div className="space-y-2.5 mb-4">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                Attached Files ({attachedFiles.length}):
              </span>

              {attachedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-400 flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                      PDF
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate max-w-[160px]">
                        {file.name}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{file.size}</span>
                    </div>
                  </div>

                  {!isTurnedIn && (
                    <button
                      onClick={() => handleRemoveFile(idx)}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition"
                      title="Remove attachment"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Benchmarking Metrics Input / Summary */}
            <div className="mb-4 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
              <div className="text-[10px] font-bold uppercase text-slate-400 font-mono flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                Algorithm Benchmarks & Test Cases
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block">Execution Time</span>
                  <input
                    type="text"
                    disabled={isTurnedIn}
                    value={execTimeMs}
                    onChange={(e) => setExecTimeMs(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs disabled:opacity-60"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Memory Peak</span>
                  <input
                    type="text"
                    disabled={isTurnedIn}
                    value={memoryKb}
                    onChange={(e) => setMemoryKb(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs disabled:opacity-60"
                  />
                </div>
              </div>
            </div>

            {/* "+ Add or Create" Dropdown (If not yet turned in) */}
            {!isTurnedIn && (
              <div className="relative mb-3">
                <button
                  type="button"
                  onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                  className="w-full py-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <Plus className="w-4 h-4 text-indigo-400" />
                  <span>+ Add or Create</span>
                </button>

                {isAddMenuOpen && (
                  <div className="absolute left-0 right-0 mt-1 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-20 space-y-1 animate-in fade-in zoom-in-95">
                    <button
                      type="button"
                      onClick={() => handleAddFile(`${currentUser.name.replace(/\s+/g, '_')}_Benchmarked_Code.pdf`, '4.1 MB')}
                      className="w-full p-2 rounded-xl text-left hover:bg-slate-800 text-xs text-white flex items-center gap-2"
                    >
                      <Paperclip className="w-4 h-4 text-indigo-400" />
                      <span>Attach Lab Report PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddFile(`${currentUser.name.replace(/\s+/g, '_')}_Valgrind_Profile.pdf`, '1.8 MB')}
                      className="w-full p-2 rounded-xl text-left hover:bg-slate-800 text-xs text-white flex items-center gap-2"
                    >
                      <FileUp className="w-4 h-4 text-emerald-400" />
                      <span>Attach Memory Profiling Scan</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* BIG CLASSROOM ACTION BUTTON: "TURN IN" OR "UNSUBMIT" */}
            <div>
              {!isTurnedIn ? (
                <button
                  onClick={handleTurnIn}
                  className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Turn In (Submit Online)</span>
                </button>
              ) : (
                <button
                  onClick={handleUnsubmit}
                  disabled={isGraded}
                  className="w-full py-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Unsubmit Assignment</span>
                </button>
              )}
            </div>

            {/* Private Comments Section (Classroom Private Messages) */}
            <div className="mt-5 pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                <span>Private comments</span>
              </div>

              {/* Comments list */}
              {studentPrivateComments.map((cmt) => (
                <div key={cmt.id} className="text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5 font-mono">
                    <span className="font-bold text-white">{cmt.sender}</span>
                    <span>{cmt.time}</span>
                  </div>
                  <p className="text-slate-200">{cmt.text}</p>
                </div>
              ))}

              <div className="relative">
                <input
                  type="text"
                  value={privateComment}
                  onChange={(e) => setPrivateComment(e.target.value)}
                  placeholder="Add private comment to teacher..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
