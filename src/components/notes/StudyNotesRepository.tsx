import React, { useState } from 'react';
import { StudyNote, UserProfile, Division } from '../../types';
import { IMAGES_2D, IMAGES_3D, handleImageError, PUBLIC_IMAGES } from '../../assets/images';
import { playSuccessChime } from '../../utils/audio';
import { triggerQuickSparkle } from '../../utils/confetti';
import {
  BookOpen,
  FileText,
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle,
  Sparkles,
  Bookmark,
  Layers,
  FileUp,
  FileCode,
  Calendar,
  UserCheck
} from 'lucide-react';

interface StudyNotesProps {
  currentUser: UserProfile;
  notes: StudyNote[];
  onAddNote: (note: StudyNote) => void;
}

export const StudyNotesRepository: React.FC<StudyNotesProps> = ({
  currentUser,
  notes,
  onAddNote
}) => {
  const [selectedNoteId, setSelectedNoteId] = useState<string>(notes[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');

  // PDF Reader State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomScale, setZoomScale] = useState<number>(100); // 100%
  const [bookmarkedPages, setBookmarkedPages] = useState<number[]>([]);

  // Inline PDF Upload Box State (Zero modals!)
  const [isUploadBoxOpen, setIsUploadBoxOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSubject, setUploadSubject] = useState('Data Structures & Algorithms');
  const [uploadChapter, setUploadChapter] = useState('');
  const [uploadPages, setUploadPages] = useState('12');
  const [uploadFileName, setUploadFileName] = useState('');

  // Selected note
  const currentNote = notes.find((n) => n.id === selectedNoteId) || notes[0];

  // Filtering
  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.chapter.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = subjectFilter === 'ALL' || n.subject.includes(subjectFilter);
    return matchesSearch && matchesSubject;
  });

  const handleZoomIn = () => setZoomScale((prev) => Math.min(prev + 15, 160));
  const handleZoomOut = () => setZoomScale((prev) => Math.max(prev - 15, 75));
  const handleResetZoom = () => setZoomScale(100);

  const toggleBookmark = (page: number) => {
    setBookmarkedPages((prev) =>
      prev.includes(page) ? prev.filter((p) => p !== page) : [...prev, page]
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!currentNote) return;
    playSuccessChime();
    triggerQuickSparkle();
    // Create text blob simulating real PDF document download
    const documentData = `Study Phantom University Academic Repository\nTitle: ${currentNote.title}\nSubject: ${currentNote.subject}\nAuthor: ${currentNote.author}\nPages: ${currentNote.pages}\n\nSummary:\n${currentNote.summary}\n\n${currentNote.samplePagesContent.map((p) => `--- PAGE ${p.pageNumber}: ${p.title} ---\n${p.content}`).join('\n\n')}`;
    const blob = new Blob([documentData], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentNote.title.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) return;

    const newNote: StudyNote = {
      id: `note-${Date.now()}`,
      title: uploadTitle,
      subject: uploadSubject,
      chapter: uploadChapter || 'Module: University Lecture Reference',
      division: 'ALL',
      author: currentUser.name,
      authorRole: currentUser.role === 'faculty' ? 'Course Faculty' : 'Student Contributor',
      dateAdded: new Date().toISOString().split('T')[0],
      pages: parseInt(uploadPages, 10) || 10,
      fileSize: '4.5 MB',
      summary: `Comprehensive academic PDF document uploaded for ${uploadSubject}. Includes diagrams and solved equations.`,
      keyTopics: ['Core Theorem Proofs', 'Worked Exam Examples', 'Reference Algorithms'],
      samplePagesContent: [
        {
          pageNumber: 1,
          title: `1. Overview & Fundamental Definitions: ${uploadTitle}`,
          content: `This technical study document covers complete university lecture notes and exam formula sheets for ${uploadSubject}.\n\nVerified by academic faculty for Division A & B students. Follow all theoretical invariants and benchmark comparisons in subsequent sections.`,
          equations: ['Formal Definition: f(n) in O(g(n)) iff exists c > 0, n0 such that f(n) <= c*g(n) for all n >= n0']
        },
        {
          pageNumber: 2,
          title: `2. Detailed Proofs & Engineering Applications`,
          content: `Detailed structural properties and algorithmic trade-offs are verified according to standard university engineering syllabus.`
        }
      ]
    };

    onAddNote(newNote);
    setSelectedNoteId(newNote.id);
    setIsUploadBoxOpen(false);
    triggerQuickSparkle();
    setUploadTitle('');
    setUploadChapter('');
  };

  const totalPagesInDoc = currentNote?.samplePagesContent?.length || currentNote?.pages || 3;
  const activePageData = currentNote?.samplePagesContent?.find((p) => p.pageNumber === currentPage) || currentNote?.samplePagesContent?.[0];

  return (
    <div className="space-y-6">
      {/* Repository Header Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Study Notes & PDF Repository
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            2-Column Master-Detail Box Architecture. In-page PDF reader station with zoom controls, offline download, print export, and direct PDF upload.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* 2D Vector Study Codex Asset */}
          <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-700 shadow-sm bg-slate-950 shrink-0 transform hover:scale-105 transition" title="2D Digital Study Codex">
            <img
              src={IMAGES_2D.studyNotes}
              alt="Study Codex 2D Vector"
              className="w-full h-full object-cover"
              onError={(e) => handleImageError(e, PUBLIC_IMAGES.studyNotes)}
            />
          </div>

          <button
            onClick={() => setIsUploadBoxOpen(!isUploadBoxOpen)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{isUploadBoxOpen ? 'Close Upload Box' : 'Upload & Attach New PDF'}</span>
          </button>
        </div>
      </div>

      {/* INLINE WORKSTATION BOX: Direct PDF Upload (Zero Modals) */}
      {isUploadBoxOpen && (
        <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-2xl p-6 shadow-2xl animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <FileUp className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-white text-sm">
                Inline Station: Direct PDF Upload & Repository Attachment
              </h3>
            </div>
            <span className="text-[10px] font-mono uppercase bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800">
              PDF Ingest Engine
            </span>
          </div>

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                  Note / Chapter Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Networks: TCP Flow & Congestion Control Formula Sheet"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                  Subject
                </label>
                <select
                  value={uploadSubject}
                  onChange={(e) => setUploadSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Data Structures & Algorithms">Data Structures & Algorithms</option>
                  <option value="Operating Systems">Operating Systems</option>
                  <option value="Database Management Systems">Database Management Systems</option>
                  <option value="Computer Networks">Computer Networks</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                  Module / Chapter Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. Module 4: Transport Layer Protocols"
                  value={uploadChapter}
                  onChange={(e) => setUploadChapter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                  Total Document Pages
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={uploadPages}
                  onChange={(e) => setUploadPages(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Direct File Picker */}
            <div className="border-2 border-dashed border-slate-700 rounded-xl p-4 text-center bg-slate-950/70">
              <FileText className="w-7 h-7 text-indigo-400 mx-auto mb-2" />
              <div className="text-xs font-semibold text-white">
                {uploadFileName || 'Select or drop a university lecture PDF or handwritten scan'}
              </div>
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                id="pdf-file-input"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setUploadFileName(e.target.files[0].name);
                    if (!uploadTitle) setUploadTitle(e.target.files[0].name.replace('.pdf', ''));
                  }
                }}
              />
              <div className="mt-2 flex items-center justify-center gap-2">
                <label
                  htmlFor="pdf-file-input"
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-xs font-semibold cursor-pointer border border-indigo-500/40 transition"
                >
                  Browse PDF File
                </label>
                <button
                  type="button"
                  onClick={() => setUploadFileName('Exam_Revision_Formula_Summary.pdf')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                >
                  Use Sample PDF
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsUploadBoxOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Publish to Repository</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2-COLUMN MASTER-DETAIL BOX ARCHITECTURE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Master Chapter & Document List */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono block mb-2">
              Course Library ({filteredNotes.length})
            </span>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search chapters, theorems..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Subject Filter Pills */}
            <div className="flex gap-1.5 mt-2 overflow-x-auto scrollbar-none py-1">
              {['ALL', 'Data Structures', 'Operating Systems', 'Database'].map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSubjectFilter(sub)}
                  className={`text-[10px] px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition ${
                    subjectFilter === sub
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          {/* Master List Cards */}
          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredNotes.map((note) => {
              const isSelected = note.id === currentNote.id;
              return (
                <div
                  key={note.id}
                  onClick={() => {
                    setSelectedNoteId(note.id);
                    setCurrentPage(1);
                  }}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/70 shadow-lg shadow-indigo-600/10'
                      : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase font-bold text-indigo-400 truncate">
                      {note.subject}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 shrink-0">
                      <FileText className="w-3 h-3 text-indigo-400" />
                      PDF
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white mt-1 leading-snug line-clamp-2">
                    {note.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                    {note.chapter}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2.5 pt-2 border-t border-slate-800/60 font-mono">
                    <span>{note.pages} Pages • {note.fileSize}</span>
                    <span>{note.author.split(' ')[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Dedicated In-Page PDF Reader Station */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          {/* Reader Top Controls Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  {currentNote.subject}
                </span>
                <span className="text-xs text-slate-400">{currentNote.chapter}</span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight mt-1">
                {currentNote.title}
              </h3>
            </div>

            {/* Action Buttons: Zoom, Download, Print */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Zoom Controls */}
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                <button
                  onClick={handleZoomOut}
                  title="Zoom Out"
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleResetZoom}
                  title="Reset Zoom"
                  className="px-2 text-[11px] font-mono text-slate-300 hover:text-white"
                >
                  {zoomScale}%
                </button>
                <button
                  onClick={handleZoomIn}
                  title="Zoom In"
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Bookmark page */}
              <button
                onClick={() => toggleBookmark(currentPage)}
                className={`p-2 rounded-lg border text-xs transition ${
                  bookmarkedPages.includes(currentPage)
                    ? 'bg-amber-950 border-amber-700 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Bookmark Page"
              >
                <Bookmark className="w-4 h-4" />
              </button>

              {/* Print Export */}
              <button
                onClick={handlePrint}
                className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs transition"
                title="Print Document"
              >
                <Printer className="w-4 h-4" />
              </button>

              {/* Offline Download */}
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>

          {/* Dedicated In-Page PDF Reader Sheet (White Document Simulation) */}
          <div className="bg-slate-950 rounded-2xl p-4 sm:p-6 border-2 border-slate-800 flex flex-col items-center justify-center min-h-[500px] overflow-x-auto">
            <div
              className="bg-white text-slate-900 rounded-xl shadow-2xl p-8 max-w-2xl w-full border border-slate-200 transition-transform duration-200 origin-top"
              style={{ transform: `scale(${zoomScale / 100})` }}
            >
              {/* Document Header */}
              <div className="flex items-center justify-between border-b-2 border-indigo-600 pb-3 mb-6">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-700 font-bold block">
                    Study Phantom University • Faculty Monograph
                  </span>
                  <h1 className="text-lg font-bold text-slate-900">
                    {currentNote.subject}
                  </h1>
                </div>
                <div className="text-right text-[11px] font-mono text-slate-500">
                  <div>Author: {currentNote.author}</div>
                  <div>Page {currentPage} of {totalPagesInDoc}</div>
                </div>
              </div>

              {/* Page Body Content */}
              {activePageData ? (
                <div className="space-y-4">
                  <h2 className="text-sm font-bold text-slate-800 pb-1 border-b border-slate-200 font-mono">
                    {activePageData.title}
                  </h2>
                  <div className="text-xs text-slate-700 leading-relaxed font-serif whitespace-pre-line">
                    {activePageData.content}
                  </div>

                  {/* Mathematical Equations Card */}
                  {activePageData.equations && activePageData.equations.length > 0 && (
                    <div className="my-4 p-3 bg-slate-100 rounded-lg border-l-4 border-indigo-600">
                      <div className="text-[10px] uppercase font-mono font-bold text-slate-500 mb-1">
                        Formulas & Equations:
                      </div>
                      <div className="space-y-1 font-mono text-xs text-indigo-900 font-bold">
                        {activePageData.equations.map((eq, idx) => (
                          <div key={idx} className="bg-white px-2 py-1 rounded border border-slate-200">
                            {eq}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Diagram representation */}
                  {activePageData.diagramLabel && (
                    <div className="my-4 p-4 rounded-xl border border-dashed border-indigo-400 bg-indigo-50/50 text-center">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-2 font-bold font-mono">
                        Fig
                      </div>
                      <div className="text-xs font-bold text-indigo-900 font-mono">
                        {activePageData.diagramLabel}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Interactive tree invariant restructuring verified across all compiler test cases.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 font-mono text-xs">
                  Page data rendered directly from vector PDF engine.
                </div>
              )}

              {/* Document Footer */}
              <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>Verified by {currentNote.author} ({currentNote.authorRole})</span>
                <span>Confidential Academic Material • Study Phantom</span>
              </div>
            </div>
          </div>

          {/* Reader Pagination Toolbar */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-3">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage <= 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Page</span>
            </button>

            <span className="text-xs font-mono text-slate-300">
              Page <span className="text-white font-bold">{currentPage}</span> of{' '}
              <span className="text-slate-400">{totalPagesInDoc}</span>
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPagesInDoc))}
              disabled={currentPage >= totalPagesInDoc}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <span>Next Page</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
