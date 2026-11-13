import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserProfile, AttendanceRecord, Assignment, Submission, StudyNote, ClassroomGroup, AppNotification, ClassNotice, Division } from './types';
import {
  INITIAL_USERS,
  INITIAL_ATTENDANCE_LOGS,
  INITIAL_ASSIGNMENTS,
  INITIAL_SUBMISSIONS,
  INITIAL_STUDY_NOTES,
  INITIAL_CLASSROOM_GROUPS,
  INITIAL_NOTIFICATIONS,
  INITIAL_NOTICES,
  WEEKLY_MEGA_TEST_QUESTIONS
} from './data/mockData';
import { Header } from './components/Header';
import { WelcomeAuthPortal } from './components/auth/WelcomeAuthPortal';
import { SquareHubDashboard } from './components/dashboard/SquareHubDashboard';
import { ClassroomGroupsStation } from './components/groups/ClassroomGroupsStation';
import { QRAttendanceStation } from './components/attendance/QRAttendanceStation';
import { AssignmentsWorkstation } from './components/assignments/AssignmentsWorkstation';
import { StudyNotesRepository } from './components/notes/StudyNotesRepository';
import { AcademicAiAnalyzer } from './components/ai/AcademicAiAnalyzer';
import { GamifiedQuizArena } from './components/quizzes/GamifiedQuizArena';
import { PomodoroFocusStation } from './components/pomodoro/PomodoroFocusStation';
import { GemRewardsStore } from './components/store/GemRewardsStore';
import { FacultyStudentLeaderboard } from './components/faculty/FacultyStudentLeaderboard';
import { UserProfileModal } from './components/profile/UserProfileModal';
import { NotificationToast } from './components/notifications/NotificationCenter';
import { BroadcastNoticeModal } from './components/notifications/BroadcastNoticeModal';
import { JarvisVoiceAssistant } from './components/voice/JarvisVoiceAssistant';
import { UnifiedSettingsModal } from './components/settings/UnifiedSettingsModal';
import { playNotificationPing, playWarningBuzzer, VoiceSettings, DEFAULT_VOICE_SETTINGS } from './utils/audio';

export default function App() {
  // App authentication & active profile state
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('studysmart_users');
      if (saved) {
        const parsed: UserProfile[] = JSON.parse(saved);
        return parsed.map((u) => {
          if (!u.parentPhone) {
            const seed = INITIAL_USERS.find((s) => s.id === u.id);
            if (seed?.parentPhone) return { ...u, parentPhone: seed.parentPhone };
          }
          return u;
        });
      }
    } catch {
      // Fallback to INITIAL_USERS
    }
    return INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const savedUserId = localStorage.getItem('studysmart_active_user_id');
    if (savedUserId) {
      try {
        const saved = localStorage.getItem('studysmart_users');
        const list: UserProfile[] = saved ? JSON.parse(saved) : INITIAL_USERS;
        const found = list.find((u) => u.id === savedUserId) || INITIAL_USERS.find((u) => u.id === savedUserId);
        if (found) {
          if (!found.parentPhone) {
            const seed = INITIAL_USERS.find((s) => s.id === found.id);
            if (seed?.parentPhone) return { ...found, parentPhone: seed.parentPhone };
          }
          return found;
        }
      } catch {
        const found = INITIAL_USERS.find((u) => u.id === savedUserId);
        if (found) return found;
      }
    }
    return null; // Show Welcome Greeting & Login/Registration first!
  });

  const [showAuthPortal, setShowAuthPortal] = useState<boolean>(() => {
    return !localStorage.getItem('studysmart_active_user_id');
  });

  const [activeTab, setActiveTab] = useState<string>('hub');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isBroadcastNoticeModalOpen, setIsBroadcastNoticeModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [activeToastNotification, setActiveToastNotification] = useState<AppNotification | null>(null);
  const [isUltimateFocusLocked, setIsUltimateFocusLocked] = useState<boolean>(false);
  const [focusLockAlertMsg, setFocusLockAlertMsg] = useState<string | null>(null);
  const focusLockAlertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFocusLockBlockedAlert = useCallback((customMsg?: string) => {
    playWarningBuzzer();
    setFocusLockAlertMsg(
      customMsg ||
        'Ultimate Focus Lock Active! Study Phantom se quit ya tab switch nahi kar sakte — sirf Phone Call attend kar sakte hain ya Parent 4-digit OTP verify karein.'
    );
    if (focusLockAlertTimerRef.current) {
      clearTimeout(focusLockAlertTimerRef.current);
    }
    focusLockAlertTimerRef.current = setTimeout(() => {
      setFocusLockAlertMsg(null);
    }, 5000);
  }, []);

  const handleGuardedTabChange = useCallback(
    (tabId: string) => {
      if (isUltimateFocusLocked && tabId !== 'pomodoro') {
        showFocusLockBlockedAlert();
        setActiveTab('pomodoro');
        return;
      }
      setActiveTab(tabId);
    },
    [isUltimateFocusLocked, showFocusLockBlockedAlert]
  );

  const handleGuardedAuthPortal = useCallback(() => {
    if (isUltimateFocusLocked) {
      showFocusLockBlockedAlert('Focus Lock Active! Logout ya app quit karne ke liye pehle Parent 4-digit OTP verify karein.');
      return;
    }
    setShowAuthPortal(true);
  }, [isUltimateFocusLocked, showFocusLockBlockedAlert]);

  const handleGuardedSwitchUser = useCallback(
    (user: UserProfile, notifyFn: (u: UserProfile) => void) => {
      if (isUltimateFocusLocked) {
        showFocusLockBlockedAlert('Focus Lock Active! Account switch locked hai jab tak Focus Session complete na ho.');
        return;
      }
      setCurrentUser(user);
      notifyFn(user);
    },
    [isUltimateFocusLocked, showFocusLockBlockedAlert]
  );

  // Prevent browser tab close / reload while Ultimate Focus Lock is active
  useEffect(() => {
    if (!isUltimateFocusLocked) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Ultimate Focus Mode is locked. Parent 4-digit OTP is required before leaving Study Phantom.';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isUltimateFocusLocked]);

  // Global Jarvis & Voice Assistant Settings State
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
    try {
      const saved = localStorage.getItem('studysmart_voice_settings');
      return saved ? JSON.parse(saved) : DEFAULT_VOICE_SETTINGS;
    } catch {
      return DEFAULT_VOICE_SETTINGS;
    }
  });

  const [wakeWordEnabled, setWakeWordEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('studysmart_wake_word_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  const [micEnabled, setMicEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('studysmart_mic_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  const handleSaveVoiceSettings = (newSettings: VoiceSettings) => {
    setVoiceSettings(newSettings);
    localStorage.setItem('studysmart_voice_settings', JSON.stringify(newSettings));
  };

  const handleToggleWakeWord = (enabled: boolean) => {
    setWakeWordEnabled(enabled);
    localStorage.setItem('studysmart_wake_word_enabled', String(enabled));
  };

  const handleToggleMic = (enabled: boolean) => {
    setMicEnabled(enabled);
    localStorage.setItem('studysmart_mic_enabled', String(enabled));
  };

  const [notifSoundEnabled, setNotifSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('studyphantom_notif_sound');
    return saved !== null ? saved === 'true' : true;
  });

  const handleToggleNotifSound = (enabled: boolean) => {
    setNotifSoundEnabled(enabled);
    localStorage.setItem('studyphantom_notif_sound', String(enabled));
  };

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerLiveNotification = useCallback(
    (notif: AppNotification, variant: 'assignment' | 'note' | 'notice' | 'urgent' | 'default' = 'default') => {
      setActiveToastNotification(notif);
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      toastTimerRef.current = setTimeout(() => {
        setActiveToastNotification(null);
      }, 8000);

      if (notifSoundEnabled) {
        playNotificationPing(notif.isUrgent ? 'urgent' : variant);
      }
    },
    [notifSoundEnabled]
  );

  // Domain state (persisted so uploads sync across tabs & reloads)
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE_LOGS);
  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    try {
      const saved = localStorage.getItem('studysmart_assignments');
      return saved ? JSON.parse(saved) : INITIAL_ASSIGNMENTS;
    } catch {
      return INITIAL_ASSIGNMENTS;
    }
  });
  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    try {
      const saved = localStorage.getItem('studysmart_submissions');
      return saved ? JSON.parse(saved) : INITIAL_SUBMISSIONS;
    } catch {
      return INITIAL_SUBMISSIONS;
    }
  });
  const [studyNotes, setStudyNotes] = useState<StudyNote[]>(() => {
    try {
      const saved = localStorage.getItem('studysmart_study_notes');
      return saved ? JSON.parse(saved) : INITIAL_STUDY_NOTES;
    } catch {
      return INITIAL_STUDY_NOTES;
    }
  });
  const [classroomGroups, setClassroomGroups] = useState<ClassroomGroup[]>(() => {
    const saved = localStorage.getItem('studysmart_classroom_groups');
    return saved ? JSON.parse(saved) : INITIAL_CLASSROOM_GROUPS;
  });
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('studysmart_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });
  const [notices, setNotices] = useState<ClassNotice[]>(() => {
    const saved = localStorage.getItem('studysmart_notices');
    return saved ? JSON.parse(saved) : INITIAL_NOTICES;
  });

  // Sync users to localStorage
  useEffect(() => {
    localStorage.setItem('studysmart_users', JSON.stringify(allUsers));
  }, [allUsers]);

  // Sync assignments, submissions & study notes to localStorage
  useEffect(() => {
    localStorage.setItem('studysmart_assignments', JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem('studysmart_submissions', JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    localStorage.setItem('studysmart_study_notes', JSON.stringify(studyNotes));
  }, [studyNotes]);

  // Sync classroom groups to localStorage
  useEffect(() => {
    localStorage.setItem('studysmart_classroom_groups', JSON.stringify(classroomGroups));
  }, [classroomGroups]);

  // Sync notifications to localStorage
  useEffect(() => {
    localStorage.setItem('studysmart_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Sync notices to localStorage
  useEffect(() => {
    localStorage.setItem('studysmart_notices', JSON.stringify(notices));
  }, [notices]);

  // Sync active user ID
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('studysmart_active_user_id', currentUser.id);
    }
  }, [currentUser]);

  // Cross-tab real-time listener: when Faculty uploads notes/notice/assignment in another tab,
  // Student tab immediately receives the update + notification toast + sound!
  useEffect(() => {
    const handleStorageSync = (e: StorageEvent) => {
      if (!e.newValue) return;
      try {
        if (e.key === 'studysmart_assignments') {
          setAssignments(JSON.parse(e.newValue));
        } else if (e.key === 'studysmart_study_notes') {
          setStudyNotes(JSON.parse(e.newValue));
        } else if (e.key === 'studysmart_submissions') {
          setSubmissions(JSON.parse(e.newValue));
        } else if (e.key === 'studysmart_notices') {
          setNotices(JSON.parse(e.newValue));
        } else if (e.key === 'studysmart_notifications') {
          const incoming: AppNotification[] = JSON.parse(e.newValue);
          setNotifications(incoming);
          const newest = incoming[0];
          if (newest && currentUser) {
            const isRelevant =
              currentUser.role === 'faculty' ||
              newest.targetDivision === 'ALL' ||
              newest.targetDivision === currentUser.division;
            const isUnread = !newest.readByStudentIds.includes(currentUser.id);
            if (isRelevant && isUnread && Date.now() - newest.timestamp < 60 * 1000) {
              const variant =
                newest.type === 'note' || newest.type === 'notice' || newest.type === 'assignment'
                  ? newest.type
                  : 'default';
              triggerLiveNotification(newest, variant);
            }
          }
        }
      } catch {
        // Ignore malformed storage payload
      }
    };
    window.addEventListener('storage', handleStorageSync);
    return () => window.removeEventListener('storage', handleStorageSync);
  }, [currentUser, triggerLiveNotification]);

  // Helper when switching to a student account: notify with sound if a faculty uploaded notes/notice/assignment recently
  const notifyRecentUnreadForUser = useCallback(
    (user: UserProfile) => {
      if (user.role !== 'student') return;
      const recentCutoff = Date.now() - 10 * 60 * 1000; // last 10 minutes
      const latestUnread = notifications.find(
        (n) =>
          n.timestamp >= recentCutoff &&
          (n.targetDivision === 'ALL' || n.targetDivision === user.division) &&
          !n.readByStudentIds.includes(user.id)
      );
      if (latestUnread) {
        const variant =
          latestUnread.type === 'note' || latestUnread.type === 'notice' || latestUnread.type === 'assignment'
            ? latestUnread.type
            : 'default';
        triggerLiveNotification(latestUnread, variant);
      }
    },
    [notifications, triggerLiveNotification]
  );

  // Handlers
  const handleSelectUser = (user: UserProfile) => {
    setCurrentUser(user);
    setShowAuthPortal(false);
    setActiveTab('hub');
    notifyRecentUnreadForUser(user);
  };

  const handleRegisterUser = (newUser: UserProfile) => {
    setAllUsers((prev) => [newUser, ...prev]);
    setCurrentUser(newUser);
    setShowAuthPortal(false);
    setActiveTab('hub');
  };

  const handleUpdateGems = (userId: string, gemDelta: number) => {
    setAllUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, gems: Math.max(0, u.gems + gemDelta) } : u))
    );
    if (currentUser && currentUser.id === userId) {
      setCurrentUser((prev) => prev ? { ...prev, gems: Math.max(0, prev.gems + gemDelta) } : null);
    }
  };

  const handleUpdateAttendancePercent = (userId: string, newPercent: number) => {
    setAllUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, attendancePercent: newPercent } : u))
    );
    if (currentUser && currentUser.id === userId) {
      setCurrentUser((prev) => prev ? { ...prev, attendancePercent: newPercent } : null);
    }
  };

  const handleIncrementStreak = (userId: string) => {
    setAllUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, streakDays: u.streakDays + 1 } : u))
    );
    if (currentUser && currentUser.id === userId) {
      setCurrentUser((prev) => prev ? { ...prev, streakDays: prev.streakDays + 1 } : null);
    }
  };

  const handleAddUserBadge = (userId: string, badgeName: string) => {
    setAllUsers((prev) =>
      prev.map((u) =>
        u.id === userId && !u.activeBadges.includes(badgeName)
          ? { ...u, activeBadges: [...u.activeBadges, badgeName] }
          : u
      )
    );
    if (currentUser && currentUser.id === userId) {
      setCurrentUser((prev) =>
        prev && !prev.activeBadges.includes(badgeName)
          ? { ...prev, activeBadges: [...prev.activeBadges, badgeName] }
          : prev
      );
    }
  };

  const handleActivateStreakFreeze = (userId: string) => {
    setAllUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, hasStreakFreeze: true } : u))
    );
    if (currentUser && currentUser.id === userId) {
      setCurrentUser((prev) => prev ? { ...prev, hasStreakFreeze: true } : null);
    }
  };

  const handleAddAttendanceLog = (record: AttendanceRecord) => {
    setAttendanceLogs((prev) => [record, ...prev]);
  };

  const handleAddAssignment = (newAssignment: Assignment) => {
    setAssignments((prev) => [newAssignment, ...prev]);

    // REAL-TIME NOTIFICATION DISPATCH TO STUDENTS:
    const notif: AppNotification = {
      id: `notif-assign-${Date.now()}`,
      type: 'assignment',
      title: `New Lab Assignment: ${newAssignment.title}`,
      message: `${newAssignment.facultyName} posted ${newAssignment.title} (${newAssignment.courseCode}) for ${newAssignment.division === 'ALL' ? 'all students' : `Division ${newAssignment.division}`}. Deadline: ${newAssignment.deadline}.`,
      facultyId: newAssignment.facultyId,
      facultyName: newAssignment.facultyName,
      facultyAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      targetDivision: newAssignment.division,
      courseCode: newAssignment.courseCode,
      createdAt: 'Just now',
      timestamp: Date.now(),
      readByStudentIds: [],
      linkTab: 'assignments',
      itemId: newAssignment.id,
      isUrgent: false
    };

    setNotifications((prev) => [notif, ...prev]);
    triggerLiveNotification(notif, 'assignment');
  };

  const handleSubmitLab = (submission: Submission) => {
    setSubmissions((prev) => [submission, ...prev]);
  };

  const handleUnsubmitLab = (submissionId: string) => {
    setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
  };

  const handleGradeSubmission = (submissionId: string, marks: number, feedback: string, graderName: string) => {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === submissionId
          ? {
              ...s,
              status: 'graded',
              obtainedMarks: marks,
              facultyFeedback: feedback,
              gradedBy: graderName,
              gradedAt: 'Just now'
            }
          : s
      )
    );
  };

  const handleAddNote = (newNote: StudyNote) => {
    setStudyNotes((prev) => [newNote, ...prev]);

    // REAL-TIME NOTIFICATION DISPATCH TO STUDENTS:
    const notif: AppNotification = {
      id: `notif-note-${Date.now()}`,
      type: 'note',
      title: `New Study Notes: ${newNote.title}`,
      message: `${newNote.author} uploaded ${newNote.pages} pages of comprehensive monograph notes for ${newNote.subject} (${newNote.chapter}).`,
      facultyId: currentUser?.id || 'fac-1',
      facultyName: newNote.author,
      facultyAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      targetDivision: newNote.division,
      courseCode: newNote.subject,
      createdAt: 'Just now',
      timestamp: Date.now(),
      readByStudentIds: [],
      linkTab: 'notes',
      itemId: newNote.id,
      isUrgent: false
    };

    setNotifications((prev) => [notif, ...prev]);
    triggerLiveNotification(notif, 'note');
  };

  const handleBroadcastNotice = (newNotice: ClassNotice) => {
    setNotices((prev) => [newNotice, ...prev]);

    // REAL-TIME NOTIFICATION DISPATCH TO STUDENTS:
    const notif: AppNotification = {
      id: `notif-notice-${Date.now()}`,
      type: 'notice',
      title: `${newNotice.isUrgent ? '🚨 URGENT NOTICE' : '📢 Faculty Notice'}: ${newNotice.title}`,
      message: `${newNotice.facultyName} (${newNotice.courseCode}): ${newNotice.content}`,
      facultyId: newNotice.facultyId,
      facultyName: newNotice.facultyName,
      facultyAvatar: newNotice.facultyAvatar,
      targetDivision: newNotice.division,
      courseCode: newNotice.courseCode,
      createdAt: 'Just now',
      timestamp: Date.now(),
      readByStudentIds: [],
      linkTab: 'groups',
      isUrgent: newNotice.isUrgent
    };

    setNotifications((prev) => [notif, ...prev]);
    triggerLiveNotification(notif, newNotice.isUrgent ? 'urgent' : 'notice');
  };

  const handleNotifyStudentsQR = (courseCode: string, division: Division) => {
    // REAL-TIME NOTIFICATION DISPATCH TO STUDENTS:
    const notif: AppNotification = {
      id: `notif-qr-${Date.now()}`,
      type: 'attendance',
      title: `⚡ Live Attendance QR Code Projected!`,
      message: `${currentUser?.name} has projected the attendance QR code for ${courseCode} (Div ${division}). Please scan immediately from the screen!`,
      facultyId: currentUser?.id || 'fac-1',
      facultyName: currentUser?.name || 'Course Faculty',
      facultyAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      targetDivision: division,
      courseCode,
      createdAt: 'Just now',
      timestamp: Date.now(),
      readByStudentIds: [],
      linkTab: 'attendance',
      isUrgent: true
    };

    setNotifications((prev) => [notif, ...prev]);
    triggerLiveNotification(notif, 'urgent');
  };

  const handleBroadcastDeadlineReminder = (targetAssignment: Assignment) => {
    // REAL-TIME 24-HOUR DEADLINE REMINDER NOTIFICATION DISPATCH TO STUDENTS:
    const notif: AppNotification = {
      id: `notif-deadline-${Date.now()}`,
      type: 'deadline_reminder',
      title: `⏰ 24-Hour Deadline Alert: ${targetAssignment.title}`,
      message: `Urgent Reminder! ${targetAssignment.title} (${targetAssignment.courseCode}) is due in less than 24 hours (${targetAssignment.deadline}). Please submit your lab report and benchmark stats online before cutoff!`,
      facultyId: targetAssignment.facultyId,
      facultyName: targetAssignment.facultyName,
      facultyAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
      targetDivision: targetAssignment.division,
      courseCode: targetAssignment.courseCode,
      createdAt: 'Just now',
      timestamp: Date.now(),
      readByStudentIds: [],
      linkTab: 'assignments',
      itemId: targetAssignment.id,
      isUrgent: true,
      hoursRemaining: 24
    };

    setNotifications((prev) => [notif, ...prev]);
    triggerLiveNotification(notif, 'urgent');
  };

  const handleMarkAsRead = (notificationId: string) => {
    if (!currentUser) return;
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId && !n.readByStudentIds.includes(currentUser.id)
          ? { ...n, readByStudentIds: [...n.readByStudentIds, currentUser.id] }
          : n
      )
    );
  };

  const handleMarkAllAsRead = () => {
    if (!currentUser) return;
    setNotifications((prev) =>
      prev.map((n) =>
        !n.readByStudentIds.includes(currentUser.id)
          ? { ...n, readByStudentIds: [...n.readByStudentIds, currentUser.id] }
          : n
      )
    );
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  const handleJoinGroup = (groupId: string, studentId: string) => {
    setClassroomGroups((prev) =>
      prev.map((g) =>
        g.id === groupId && !g.enrolledStudentIds.includes(studentId)
          ? { ...g, enrolledStudentIds: [...g.enrolledStudentIds, studentId] }
          : g
      )
    );
    // Award +25 bonus gems for enrolling in classroom
    handleUpdateGems(studentId, 25);
  };

  const handleLeaveGroup = (groupId: string, studentId: string) => {
    setClassroomGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, enrolledStudentIds: g.enrolledStudentIds.filter((id) => id !== studentId) }
          : g
      )
    );
  };

  const handleCreateGroup = (newGroup: ClassroomGroup) => {
    setClassroomGroups((prev) => [newGroup, ...prev]);
  };

  const handleUpdateGroupPassword = (groupId: string, newPassword: string) => {
    setClassroomGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, groupPassword: newPassword } : g))
    );
  };

  const handleRemoveStudentFromGroup = (groupId: string, studentId: string) => {
    setClassroomGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, enrolledStudentIds: g.enrolledStudentIds.filter((id) => id !== studentId) }
          : g
      )
    );
  };

  const handleUpdateProfile = (updatedUser: UserProfile) => {
    setCurrentUser(updatedUser);
    setAllUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    );
  };

  // If user is not selected or opted to open Welcome Screen, show Hello Faculty & Students Portal!
  if (!currentUser || showAuthPortal) {
    return (
      <WelcomeAuthPortal
        allUsers={allUsers}
        onSelectUser={handleSelectUser}
        onRegisterUser={handleRegisterUser}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Application Header with Role Switcher & Navigation */}
      <Header
        currentUser={currentUser}
        allUsers={allUsers}
        onSwitchUser={(user) => handleGuardedSwitchUser(user, notifyRecentUnreadForUser)}
        activeTab={activeTab}
        setActiveTab={handleGuardedTabChange}
        onOpenAuthPortal={handleGuardedAuthPortal}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onClearNotifications={handleClearNotifications}
        onOpenBroadcastModal={() => setIsBroadcastNoticeModalOpen(true)}
        notifSoundEnabled={notifSoundEnabled}
        onToggleNotifSound={handleToggleNotifSound}
        isFocusLocked={isUltimateFocusLocked}
      />

      {focusLockAlertMsg && (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="p-3.5 rounded-2xl bg-rose-600 text-white text-xs font-bold shadow-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <span>🔒 {focusLockAlertMsg}</span>
            <button
              type="button"
              onClick={() => setFocusLockAlertMsg(null)}
              className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-[11px] font-mono cursor-pointer shrink-0"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'hub' && (
          <SquareHubDashboard
            currentUser={currentUser}
            allUsers={allUsers}
            onNavigateTab={handleGuardedTabChange}
            onOpenAuthPortal={handleGuardedAuthPortal}
            onOpenProfileModal={() => setIsProfileModalOpen(true)}
            totalAssignments={assignments.length}
            totalNotes={studyNotes.length}
          />
        )}

        {activeTab === 'groups' && (
          <ClassroomGroupsStation
            currentUser={currentUser}
            classroomGroups={classroomGroups}
            allUsers={allUsers}
            onJoinGroup={handleJoinGroup}
            onLeaveGroup={handleLeaveGroup}
            onCreateGroup={handleCreateGroup}
            onUpdateGroupPassword={handleUpdateGroupPassword}
            onRemoveStudentFromGroup={handleRemoveStudentFromGroup}
            onNavigateTab={handleGuardedTabChange}
          />
        )}

        {activeTab === 'attendance' && (
          <QRAttendanceStation
            currentUser={currentUser}
            attendanceLogs={attendanceLogs}
            onAddAttendanceLog={handleAddAttendanceLog}
            onUpdateUserGems={handleUpdateGems}
            onUpdateAttendancePercent={handleUpdateAttendancePercent}
            onNotifyStudentsQR={handleNotifyStudentsQR}
          />
        )}

        {activeTab === 'assignments' && (
          <AssignmentsWorkstation
            currentUser={currentUser}
            assignments={assignments}
            submissions={submissions}
            onAddAssignment={handleAddAssignment}
            onSubmitLab={handleSubmitLab}
            onGradeSubmission={handleGradeSubmission}
            onUnsubmitLab={handleUnsubmitLab}
            onTriggerDeadlineReminder={handleBroadcastDeadlineReminder}
          />
        )}

        {activeTab === 'notes' && (
          <StudyNotesRepository
            currentUser={currentUser}
            notes={studyNotes}
            onAddNote={handleAddNote}
          />
        )}

        {activeTab === 'ai' && (
          <AcademicAiAnalyzer
            currentUser={currentUser}
            notes={studyNotes}
            assignments={assignments}
            questionBank={WEEKLY_MEGA_TEST_QUESTIONS}
          />
        )}

        {activeTab === 'quizzes' && (
          <GamifiedQuizArena
            currentUser={currentUser}
            onUpdateUserGems={handleUpdateGems}
          />
        )}

        {activeTab === 'leaderboard' && (
          <FacultyStudentLeaderboard
            currentUser={currentUser}
            allUsers={allUsers}
            onAwardBonusGems={handleUpdateGems}
          />
        )}

        {activeTab === 'pomodoro' && (
          <PomodoroFocusStation
            currentUser={currentUser}
            onUpdateUserGems={handleUpdateGems}
            onIncrementStreak={handleIncrementStreak}
            onUpdateProfile={handleUpdateProfile}
            onFocusLockChange={setIsUltimateFocusLocked}
          />
        )}

        {activeTab === 'store' && (
          <GemRewardsStore
            currentUser={currentUser}
            onUpdateUserGems={handleUpdateGems}
            onAddUserBadge={handleAddUserBadge}
            onActivateStreakFreeze={handleActivateStreakFreeze}
          />
        )}
      </main>

      {/* Bottom Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Study Phantom Academic Ecosystem</span>
            <span>•</span>
            <span>All Academic Branches • Division A & B</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleGuardedAuthPortal}
              className={`font-mono text-xs underline font-semibold ${
                isUltimateFocusLocked
                  ? 'text-slate-400 cursor-not-allowed'
                  : 'text-blue-600 hover:text-blue-700'
              }`}
            >
              {isUltimateFocusLocked ? '🔒 Logout Locked (Focus Active)' : 'Logout / Hello Faculty & Students Portal'}
            </button>
            <span className="font-mono text-[11px] text-slate-400">v2.4 Pro Production Build</span>
          </div>
        </div>
      </footer>

      {/* Personal Profile Settings Modal */}
      {currentUser && (
        <UserProfileModal
          currentUser={currentUser}
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          onUpdateProfile={handleUpdateProfile}
        />
      )}

      {/* Floating Real-Time Notification Toast Alert */}
      <NotificationToast
        notification={activeToastNotification}
        onClose={() => setActiveToastNotification(null)}
        onOpenItem={(tabId) => handleGuardedTabChange(tabId)}
      />

      {/* Faculty Broadcast Notice Modal */}
      {currentUser && currentUser.role === 'faculty' && (
        <BroadcastNoticeModal
          currentUser={currentUser}
          isOpen={isBroadcastNoticeModalOpen}
          onClose={() => setIsBroadcastNoticeModalOpen(false)}
          onBroadcastNotice={handleBroadcastNotice}
        />
      )}

      {/* Unified Settings Modal: Personal Profile, Gems, Streak, Student Portal & Jarvis Voice Assistant */}
      {currentUser && (
        <UnifiedSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          currentUser={currentUser}
          allUsers={allUsers}
          onSwitchUser={(user) => handleGuardedSwitchUser(user, notifyRecentUnreadForUser)}
          onUpdateProfile={handleUpdateProfile}
          onOpenAuthPortal={() => {
            if (isUltimateFocusLocked) {
              setIsSettingsModalOpen(false);
              handleGuardedAuthPortal();
              return;
            }
            setIsSettingsModalOpen(false);
            setShowAuthPortal(true);
          }}
          onOpenProfileModal={() => {
            setIsSettingsModalOpen(false);
            setIsProfileModalOpen(true);
          }}
          voiceSettings={voiceSettings}
          onSaveVoiceSettings={handleSaveVoiceSettings}
          wakeWordEnabled={wakeWordEnabled}
          onToggleWakeWord={handleToggleWakeWord}
          micEnabled={micEnabled}
          onToggleMic={handleToggleMic}
          onNavigateTab={(tabId) => {
            handleGuardedTabChange(tabId);
            setIsSettingsModalOpen(false);
          }}
          onActivateStreakFreeze={() => handleActivateStreakFreeze(currentUser.id)}
        />
      )}

      {/* Futuristic Jarvis AI Voice Co-Pilot */}
      {currentUser && (
        <JarvisVoiceAssistant
          currentUser={currentUser}
          allUsers={allUsers}
          assignments={assignments}
          notes={studyNotes}
          activeTab={activeTab}
          onNavigateTab={handleGuardedTabChange}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
          voiceSettings={voiceSettings}
          onSaveVoiceSettings={handleSaveVoiceSettings}
          wakeWordEnabled={wakeWordEnabled}
          onToggleWakeWord={handleToggleWakeWord}
          micEnabled={micEnabled}
          onToggleMic={handleToggleMic}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
        />
      )}
    </div>
  );
}
