import React, { useState } from 'react';
import { UserProfile, AppNotification, ClassNotice } from '../../types';
import {
  Bell,
  BellRing,
  FileText,
  BookOpen,
  Megaphone,
  QrCode,
  Check,
  CheckCheck,
  Clock,
  Sparkles,
  ExternalLink,
  X,
  Send,
  AlertCircle,
  Volume2,
  VolumeX
} from 'lucide-react';
import { triggerQuickSparkle } from '../../utils/confetti';
import { playNotificationPing } from '../../utils/audio';

interface NotificationCenterProps {
  currentUser: UserProfile;
  notifications: AppNotification[];
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onClearNotifications: () => void;
  onNavigateTab: (tabId: string) => void;
  notifSoundEnabled?: boolean;
  onToggleNotifSound?: (enabled: boolean) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  currentUser,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearNotifications,
  onNavigateTab,
  notifSoundEnabled = true,
  onToggleNotifSound
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'deadline' | 'assignment' | 'note' | 'notice'>('all');

  // Filter notifications relevant to current student (matching division or ALL)
  const studentNotifications = notifications.filter((n) => {
    if (currentUser.role === 'faculty') return true; // Faculty sees all their broadcasts
    if (n.targetDivision === 'ALL') return true;
    return n.targetDivision === currentUser.division;
  });

  const unreadCount = studentNotifications.filter(
    (n) => !n.readByStudentIds.includes(currentUser.id)
  ).length;

  const filteredNotifications = studentNotifications.filter((n) => {
    const isUnread = !n.readByStudentIds.includes(currentUser.id);
    if (filter === 'unread') return isUnread;
    if (filter === 'deadline') return n.type === 'deadline_reminder';
    if (filter === 'assignment') return n.type === 'assignment';
    if (filter === 'note') return n.type === 'note';
    if (filter === 'notice') return n.type === 'notice';
    return true;
  });

  const getTypeIcon = (type: string, isUrgent?: boolean) => {
    switch (type) {
      case 'deadline_reminder':
        return <Clock className="w-4 h-4 text-rose-400 animate-pulse" />;
      case 'assignment':
        return <FileText className="w-4 h-4 text-emerald-400" />;
      case 'note':
        return <BookOpen className="w-4 h-4 text-sky-400" />;
      case 'notice':
        return <Megaphone className={`w-4 h-4 ${isUrgent ? 'text-rose-400' : 'text-amber-400'}`} />;
      default:
        return <Bell className="w-4 h-4 text-indigo-400" />;
    }
  };

  const getTypeBadge = (type: string, isUrgent?: boolean) => {
    if (type === 'deadline_reminder') {
      return (
        <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold flex items-center gap-1">
          <Clock className="w-3 h-3 text-rose-600" />
          24h Deadline Alert
        </span>
      );
    }
    if (isUrgent) {
      return (
        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold">
          Urgent Notice
        </span>
      );
    }
    switch (type) {
      case 'assignment':
        return (
          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
            New Lab
          </span>
        );
      case 'note':
        return (
          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
            Study Notes
          </span>
        );
      case 'notice':
        return (
          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold">
            Notice
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative">
      {/* Bell Trigger Button in Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={unreadCount > 0 ? `${unreadCount} unread faculty notifications` : 'Faculty Notifications'}
        className={`relative p-2 rounded-xl transition flex items-center justify-center ${
          unreadCount > 0
            ? 'bg-indigo-50 border border-indigo-300 text-indigo-700 hover:bg-indigo-100 shadow-sm'
            : 'bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700'
        }`}
      >
        {unreadCount > 0 ? (
          <BellRing className="w-4 h-4 text-amber-500 animate-bounce" />
        ) : (
          <Bell className="w-4 h-4" />
        )}

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 border-2 border-white text-white font-mono text-[10px] font-black flex items-center justify-center shadow animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Drawer */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[2px]"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl bg-white border border-slate-200 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Notifications & Notices</h3>
                  <p className="text-[10px] text-slate-500">
                    Real-time alerts from your faculty
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {onToggleNotifSound && (
                  <button
                    onClick={() => {
                      const next = !notifSoundEnabled;
                      onToggleNotifSound(next);
                      if (next) playNotificationPing('notice');
                    }}
                    title={notifSoundEnabled ? 'Notification sound ON (click to mute)' : 'Notification sound muted (click to enable)'}
                    className={`px-2 py-1 rounded-lg border text-[10px] font-mono font-bold flex items-center gap-1 transition cursor-pointer ${
                      notifSoundEnabled
                        ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                        : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {notifSoundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    <span>{notifSoundEnabled ? 'Sound On' : 'Muted'}</span>
                  </button>
                )}
                {unreadCount > 0 && (
                  <button
                    onClick={() => {
                      onMarkAllAsRead();
                      triggerQuickSparkle();
                    }}
                    title="Mark all as read"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100 transition text-[11px] font-mono flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[10px]">Mark all read</span>
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-none text-[11px] font-semibold border-b border-slate-100">
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                  filter === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                All ({studentNotifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                  filter === 'unread'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Unread ({unreadCount})
              </button>
              <button
                onClick={() => setFilter('deadline')}
                className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
                  filter === 'deadline'
                    ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                    : 'text-rose-700 hover:text-rose-900 hover:bg-rose-50 border border-rose-200'
                }`}
              >
                <Clock className="w-3 h-3" />
                Deadlines ({studentNotifications.filter((n) => n.type === 'deadline_reminder').length})
              </button>
              <button
                onClick={() => setFilter('assignment')}
                className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                  filter === 'assignment'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Labs
              </button>
              <button
                onClick={() => setFilter('note')}
                className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                  filter === 'note'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Notes
              </button>
              <button
                onClick={() => setFilter('notice')}
                className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                  filter === 'notice'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Notices
              </button>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 py-3 pr-1">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <Bell className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-500">No notifications here</p>
                  <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto">
                    When faculty gives a notice, notes, or lab assignment, it will appear right here!
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notif) => {
                  const isRead = notif.readByStudentIds.includes(currentUser.id);
                  const isDeadline = notif.type === 'deadline_reminder';
                  return (
                    <div
                      key={notif.id}
                      onClick={() => {
                        onMarkAsRead(notif.id);
                        if (notif.linkTab) {
                          onNavigateTab(notif.linkTab);
                          setIsOpen(false);
                        }
                      }}
                      className={`p-3 rounded-2xl border transition cursor-pointer relative group ${
                        isDeadline
                          ? isRead
                            ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
                            : 'bg-rose-50 border-rose-400 hover:border-rose-500 shadow-md'
                          : isRead
                          ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                          : 'bg-indigo-50/50 border-indigo-200 hover:border-indigo-300 shadow-sm'
                      }`}
                    >
                      {/* Top Bar: Faculty Avatar, Name, Type Badge, and Time */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={notif.facultyAvatar}
                            alt={notif.facultyName}
                            className={`w-6 h-6 rounded-lg object-cover ring-1 shrink-0 ${
                              isDeadline ? 'ring-rose-400' : 'ring-slate-300'
                            }`}
                          />
                          <span className="text-[11px] font-bold text-slate-800 truncate">
                            {notif.facultyName}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {getTypeBadge(notif.type, notif.isUrgent)}
                          <span className="text-[10px] font-mono text-slate-500">
                            {notif.createdAt}
                          </span>
                        </div>
                      </div>

                      {/* Title & Message */}
                      <h4 className={`text-xs font-black transition line-clamp-1 ${
                        isDeadline ? 'text-rose-900 group-hover:text-rose-700' : 'text-slate-900 group-hover:text-indigo-600'
                      }`}>
                        {notif.title}
                      </h4>
                      <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>

                      {/* Footer: Course code & Shortcut Action */}
                      <div className="mt-2.5 pt-2 border-t border-slate-200/70 flex items-center justify-between text-[10px]">
                        <span className="font-mono text-slate-500">
                          {notif.courseCode ? `Course: ${notif.courseCode}` : 'Engineering Department'}
                          {notif.targetDivision !== 'ALL' && ` • Div ${notif.targetDivision}`}
                        </span>

                        <span className={`font-bold flex items-center gap-1 ${
                          isDeadline ? 'text-rose-600 group-hover:text-rose-700' : 'text-indigo-600 group-hover:text-indigo-700'
                        }`}>
                          <span>{isDeadline ? 'Turn In Now' : 'Open'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>

                      {/* Unread dot */}
                      {!isRead && (
                        <span className={`absolute top-3 right-3 w-2 h-2 rounded-full animate-pulse ${
                          isDeadline ? 'bg-rose-500' : 'bg-indigo-500'
                        }`} />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer with Clear All */}
            {filteredNotifications.length > 0 && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                <span>{filteredNotifications.length} items</span>
                <button
                  onClick={onClearNotifications}
                  className="hover:text-rose-600 transition underline font-mono"
                >
                  Clear all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// =========================================================================
// FLOATING TOAST NOTIFICATION COMPONENT (When new item arrives live)
// =========================================================================
interface NotificationToastProps {
  notification: AppNotification | null;
  onClose: () => void;
  onOpenItem: (tabId: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  onOpenItem
}) => {
  if (!notification) return null;

  const isDeadline = notification.type === 'deadline_reminder';
  const isUrgent = isDeadline || notification.isUrgent;
  const typeLabel =
    isDeadline
      ? '24H DEADLINE REMINDER'
      : notification.type === 'note'
      ? 'NEW NOTES UPLOADED'
      : notification.type === 'assignment'
      ? 'NEW LAB ASSIGNMENT'
      : notification.type === 'notice'
      ? (notification.isUrgent ? 'URGENT NOTICE' : 'NEW FACULTY NOTICE')
      : 'FACULTY ALERT';

  return (
    <div className={`fixed top-20 right-4 sm:right-6 z-50 w-80 sm:w-96 rounded-2xl bg-white border-2 shadow-xl p-4 animate-in slide-in-from-top-4 duration-300 ${
      isUrgent
        ? 'border-rose-500 ring-2 ring-rose-500/15'
        : 'border-blue-600 ring-2 ring-blue-600/15'
    }`}>
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <img
            src={notification.facultyAvatar}
            alt={notification.facultyName}
            className={`w-10 h-10 rounded-xl object-cover ring-2 ${
              isUrgent ? 'ring-rose-500' : 'ring-blue-600'
            }`}
          />
          <span className={`absolute -bottom-1 -right-1 p-0.5 rounded-full text-white shadow ${
            isUrgent ? 'bg-rose-600 animate-pulse' : 'bg-blue-600'
          }`}>
            {isDeadline ? <Clock className="w-3 h-3" /> : <BellRing className="w-3 h-3" />}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className={`text-[10px] font-mono uppercase font-black flex items-center gap-1 ${
              isUrgent ? 'text-rose-600' : 'text-blue-600'
            }`}>
              <span>{typeLabel} • {notification.createdAt}</span>
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() =>
                  playNotificationPing(
                    notification.isUrgent
                      ? 'urgent'
                      : notification.type === 'note' || notification.type === 'notice' || notification.type === 'assignment'
                      ? notification.type
                      : 'default'
                  )
                }
                title="Replay notification sound"
                className="text-blue-600 hover:text-blue-700 p-0.5 rounded hover:bg-blue-50 transition cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <h4 className={`text-xs font-bold mt-0.5 line-clamp-1 ${
            isUrgent ? 'text-rose-900' : 'text-slate-900'
          }`}>
            {notification.title}
          </h4>
          <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
            {notification.message}
          </p>

          <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-[10px] font-mono text-slate-500">
              From: {notification.facultyName}
            </span>
            <button
              onClick={() => {
                if (notification.linkTab) onOpenItem(notification.linkTab);
                onClose();
              }}
              className={`px-3 py-1 rounded-lg text-white font-bold text-[10px] flex items-center gap-1 shadow-xs transition cursor-pointer ${
                isUrgent
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <span>{isDeadline ? 'Submit Work Now' : 'View Now'}</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
