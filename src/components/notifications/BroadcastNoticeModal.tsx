import React, { useState } from 'react';
import { UserProfile, Division, ClassNotice } from '../../types';
import {
  Megaphone,
  Send,
  X,
  AlertTriangle,
  Sparkles,
  BookOpen,
  Layers,
  GraduationCap
} from 'lucide-react';
import { triggerQuickSparkle } from '../../utils/confetti';

interface BroadcastNoticeModalProps {
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onBroadcastNotice: (notice: ClassNotice) => void;
}

export const BroadcastNoticeModal: React.FC<BroadcastNoticeModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onBroadcastNotice
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [courseCode, setCourseCode] = useState('CS302');
  const [division, setDivision] = useState<Division | 'ALL'>('ALL');
  const [isUrgent, setIsUrgent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const newNotice: ClassNotice = {
      id: `notice-${Date.now()}`,
      facultyId: currentUser.id,
      facultyName: currentUser.name,
      facultyAvatar: currentUser.avatar,
      title: title.trim(),
      content: content.trim(),
      courseCode: courseCode.trim().toUpperCase(),
      division,
      createdAt: 'Just now',
      isUrgent
    };

    onBroadcastNotice(newNotice);
    triggerQuickSparkle();
    onClose();
    setTitle('');
    setContent('');
    setIsUrgent(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Broadcast Notice to Students</h2>
              <p className="text-xs text-slate-500">
                Pushes an instant notification with sound to student devices
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Course Module <span className="text-rose-500">*</span>
              </label>
              <select
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:border-blue-600 outline-none"
              >
                <option value="CS302">CS302 Compiler Design</option>
                <option value="CS304">CS304 Operating Systems</option>
                <option value="CS305">CS305 DBMS</option>
                <option value="CS306">CS306 Computer Networks</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Target Division <span className="text-rose-500">*</span>
              </label>
              <select
                value={division}
                onChange={(e) => setDivision(e.target.value as Division | 'ALL')}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:border-blue-600 outline-none"
              >
                <option value="ALL">All Students (Div A & B)</option>
                <option value="A">Division A Only</option>
                <option value="B">Division B Only</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Notice Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Lab 4 Submission Deadline Extended & Evaluation Slot"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:border-blue-600 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Notice Announcement Message <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide exact guidelines, timings, lab room, or instructions for students..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:border-blue-600 outline-none"
            />
          </div>

          {/* Urgent Checkbox */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50/60 border border-rose-200">
            <input
              type="checkbox"
              id="urgent"
              checked={isUrgent}
              onChange={(e) => setIsUrgent(e.target.checked)}
              className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
            />
            <label htmlFor="urgent" className="text-xs text-slate-800 cursor-pointer flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Mark as High-Priority / Urgent Announcement</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>Send Notice & Notify Students</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
