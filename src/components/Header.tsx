import React, { useState } from 'react';
import { UserProfile, Role, AppNotification } from '../types';
import { NotificationCenter } from './notifications/NotificationCenter';
import { AppIcon } from './AppIcon';
import {
  Sparkles,
  Flame,
  ShieldCheck,
  ChevronDown,
  QrCode,
  FileText,
  BookOpen,
  Trophy,
  Timer,
  ShoppingBag,
  UserCheck,
  LayoutGrid,
  LogOut,
  Bot,
  Users,
  UserCog,
  Megaphone,
  Mic,
  Zap,
  Settings,
  Lock
} from 'lucide-react';

interface HeaderProps {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onSwitchUser: (user: UserProfile) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenStoreModal?: () => void;
  onOpenAuthPortal?: () => void;
  onOpenProfileModal?: () => void;
  onOpenSettings?: () => void;
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearNotifications: () => void;
  onOpenBroadcastModal?: () => void;
  notifSoundEnabled?: boolean;
  onToggleNotifSound?: (enabled: boolean) => void;
  isFocusLocked?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  allUsers,
  onSwitchUser,
  activeTab,
  setActiveTab,
  onOpenAuthPortal,
  onOpenProfileModal,
  onOpenSettings,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearNotifications,
  onOpenBroadcastModal,
  notifSoundEnabled,
  onToggleNotifSound,
  isFocusLocked = false
}) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const facultyTabs = [
    {
      id: 'hub',
      label: 'Square Hub',
      icon: LayoutGrid
    },
    {
      id: 'groups',
      label: 'Classroom Groups & Passwords',
      icon: Users
    },
    {
      id: 'attendance',
      label: 'QR Attendance Projector',
      icon: QrCode
    },
    {
      id: 'assignments',
      label: 'Lab Assignments & Grading',
      icon: FileText
    },
    {
      id: 'notes',
      label: 'Course Notes & PDFs',
      icon: BookOpen
    },
    {
      id: 'leaderboard',
      label: 'Student Performance Dashboard',
      icon: Trophy
    }
  ];

  const studentTabs = [
    {
      id: 'hub',
      label: 'Square Hub',
      icon: LayoutGrid
    },
    {
      id: 'groups',
      label: 'My Classroom Groups',
      icon: Users
    },
    {
      id: 'attendance',
      label: 'Scan Attendance',
      icon: QrCode
    },
    {
      id: 'assignments',
      label: 'My Lab Workstation',
      icon: FileText
    },
    {
      id: 'notes',
      label: 'PDF & Notes Reader',
      icon: BookOpen
    },
    {
      id: 'ai',
      label: 'Academic AI Tutor',
      icon: Bot
    },
    {
      id: 'quizzes',
      label: 'Quizzes & Mega Test',
      icon: Trophy
    },
    {
      id: 'pomodoro',
      label: 'Ultimate Focus Mode',
      icon: Timer
    },
    {
      id: 'store',
      label: 'Gems Perk Store',
      icon: ShoppingBag
    }
  ];

  const tabs = currentUser.role === 'faculty' ? facultyTabs : studentTabs;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand (Clickable to return to Hub) */}
          <div
            onClick={() => setActiveTab('hub')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <AppIcon className="h-10 w-10 rounded-xl shadow-xs transition transform group-hover:scale-105 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">
                  Study Phantom
                </span>
                <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold border ${
                  currentUser.role === 'faculty'
                    ? 'bg-slate-100 text-slate-700 border-slate-300'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {currentUser.role === 'faculty' ? 'Faculty Portal' : 'Student Portal'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Multi-Branch Academic Ecosystem
              </p>
            </div>
          </div>

          {/* User Gamification Badges (Students) or Academic Status (Faculty) */}
          <div className="flex items-center gap-3">
            {isFocusLocked && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-mono font-bold">
                <Lock className="w-3 h-3 text-rose-600" />
                <span>Focus Lock Active</span>
              </span>
            )}
            {currentUser.role === 'faculty' && (
              /* Faculty Academic Status Indicators */
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-[11px] font-mono bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1 rounded-xl">
                  Mentor: Div {currentUser.division}
                </span>
                <span className="text-[11px] font-mono bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-xl">
                  Class Avg: 89.1%
                </span>
              </div>
            )}

            {/* Unified Settings Gear Icon Button (Profile, Gems, Streak, Portal & Jarvis) */}
            <button
              onClick={onOpenSettings}
              title="Settings (Personal Profile, Gems, Streak, Student Portal & Jarvis)"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-blue-600 transition flex items-center justify-center cursor-pointer relative group"
            >
              <Settings className="w-4 h-4 text-slate-700 group-hover:rotate-45 transition-transform duration-300" />
              {currentUser.streakDays > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
              ) : currentUser.gems > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-white" />
              ) : null}
            </button>

            {/* Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition text-left"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-lg object-cover ring-1 ring-indigo-400"
                  onError={(e) => {
                    e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><rect width="60" height="60" fill="%236366f1"/><text x="50%" y="55%" font-family="sans-serif" font-size="24" font-weight="bold" fill="%23ffffff" dominant-baseline="middle" text-anchor="middle">${encodeURIComponent(currentUser.name.charAt(0))}</text></svg>`;
                  }}
                />
                <div className="hidden md:block">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-800">{currentUser.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono uppercase font-bold ${
                      currentUser.role === 'faculty' 
                        ? 'bg-purple-100 text-purple-800 border border-purple-300' 
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}>
                      {currentUser.role === 'faculty' ? 'Faculty' : `Div ${currentUser.division}`}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 block truncate max-w-[140px]">
                    {currentUser.role === 'student' ? currentUser.rollNumber : currentUser.title.split('(')[0]}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                    {/* Direct Profile & Photo Edit Option */}
                    {onOpenProfileModal && (
                      <div className="p-1 mb-1 border-b border-slate-100">
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            onOpenProfileModal();
                          }}
                          className="w-full p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition"
                        >
                          <UserCog className="w-4 h-4" />
                          <span>My Profile & Edit Photo</span>
                        </button>
                      </div>
                    )}

                    <div className="px-2 py-1.5 border-b border-slate-100 text-[11px] font-medium text-slate-500">
                      Switch Active Perspective:
                    </div>
                    <div className="space-y-1 mt-1">
                      {allUsers.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => {
                            onSwitchUser(user);
                            setDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition ${
                            currentUser.id === user.id
                              ? 'bg-indigo-50 text-indigo-900 border border-indigo-200'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200"
                            onError={(e) => {
                              e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><rect width="60" height="60" fill="%236366f1"/><text x="50%" y="55%" font-family="sans-serif" font-size="24" font-weight="bold" fill="%23ffffff" dominant-baseline="middle" text-anchor="middle">${encodeURIComponent(user.name.charAt(0))}</text></svg>`;
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold truncate text-slate-900">{user.name}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                                user.role === 'faculty' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {user.role === 'faculty' ? 'Faculty' : `Div ${user.division}`}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 truncate block">
                              {user.role === 'faculty' ? user.title : `${user.rollNumber} • ${user.attendancePercent}% Att.`}
                            </span>
                          </div>
                          {currentUser.id === user.id && (
                            <UserCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>

                    {onOpenAuthPortal && (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            onOpenAuthPortal();
                          }}
                          className="w-full py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Open Welcome / Login Screen</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Faculty Broadcast Notice Button */}
            {currentUser.role === 'faculty' && onOpenBroadcastModal && (
              <button
                onClick={onOpenBroadcastModal}
                title="Broadcast Notice / Announcement to Students"
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Broadcast Notice</span>
              </button>
            )}

            {/* Notification Center Bell (with unread count badge & interactive drawer) */}
            <NotificationCenter
              currentUser={currentUser}
              notifications={notifications}
              onMarkAsRead={onMarkAsRead}
              onMarkAllAsRead={onMarkAllAsRead}
              onClearNotifications={onClearNotifications}
              onNavigateTab={(tab) => setActiveTab(tab)}
              notifSoundEnabled={notifSoundEnabled}
              onToggleNotifSound={onToggleNotifSound}
            />
          </div>
        </div>

        {/* Desktop-First Navigation Bar with Clean Academic Palette */}
        <nav className="flex space-x-1.5 overflow-x-auto py-2.5 scrollbar-none border-t border-slate-100">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const tabBlocked = isFocusLocked && tab.id !== 'pomodoro';
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                title={tabBlocked ? 'Locked during Ultimate Focus Mode (Parent OTP required)' : tab.label}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : tabBlocked
                    ? 'text-slate-400 bg-slate-50 cursor-not-allowed'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : tabBlocked ? 'text-slate-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tabBlocked && <Lock className="w-3 h-3 text-rose-500" />}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
