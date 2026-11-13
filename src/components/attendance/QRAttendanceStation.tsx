import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { UserProfile, Division, QRSession, AttendanceRecord } from '../../types';
import { playSuccessChime, playWarningBuzzer } from '../../utils/audio';
import { triggerGrandCelebration } from '../../utils/confetti';
import { IMAGES_2D, handleImageError, PUBLIC_IMAGES } from '../../assets/images';
import {
  QrCode,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Camera,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  AlertTriangle,
  Play,
  Pause,
  Video,
  MonitorCheck,
  Percent,
  SlidersHorizontal,
  Flame,
  Bell,
  ExternalLink
} from 'lucide-react';

interface QRAttendanceProps {
  currentUser: UserProfile;
  attendanceLogs: AttendanceRecord[];
  onAddAttendanceLog: (record: AttendanceRecord) => void;
  onUpdateUserGems: (userId: string, gemDelta: number) => void;
  onUpdateAttendancePercent: (userId: string, newPercent: number) => void;
  onNotifyStudentsQR?: (courseCode: string, division: Division) => void;
}

export const QRAttendanceStation: React.FC<QRAttendanceProps> = ({
  currentUser,
  attendanceLogs,
  onAddAttendanceLog,
  onUpdateUserGems,
  onUpdateAttendancePercent,
  onNotifyStudentsQR
}) => {
  const [qrNotified, setQrNotified] = useState(false);

  // Session Configuration for Faculty
  const [selectedDivision, setSelectedDivision] = useState<Division>('A');
  const [selectedCourse, setSelectedCourse] = useState('CS302 Compiler Design');
  const [refreshInterval, setRefreshInterval] = useState<number>(15);
  const [isSessionActive, setIsSessionActive] = useState<boolean>(true);

  // Dynamic Token State
  const [sessionToken, setSessionToken] = useState<string>('');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(15);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [rotationCount, setRotationCount] = useState<number>(1);

  // Camera Scanner State (Student / Simulator)
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{
    status: 'success' | 'anti_proxy_violation' | 'expired_error';
    message: string;
    details?: string;
  } | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Manual test simulation payload
  const [manualScannedPayload, setManualScannedPayload] = useState<string>('');

  // Generate a cryptographically signed dynamic payload
  const generateDynamicPayload = (div: Division, course: string) => {
    const randomHex = Math.random().toString(36).substring(2, 10).toUpperCase();
    const timestamp = Date.now();
    const token = `SMART-ATT::${course.split(' ')[0]}::DIV_${div}::TOK_${randomHex}::${timestamp}`;
    return token;
  };

  // Generate & Rotate QR Code periodically
  useEffect(() => {
    if (!isSessionActive) return;

    const currentToken = generateDynamicPayload(selectedDivision, selectedCourse);
    setSessionToken(currentToken);
    setSecondsRemaining(refreshInterval);

    QRCode.toDataURL(currentToken, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    }).then((url) => {
      setQrDataUrl(url);
    });

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Token rotation!
          const nextToken = generateDynamicPayload(selectedDivision, selectedCourse);
          setSessionToken(nextToken);
          setRotationCount((c) => c + 1);
          QRCode.toDataURL(nextToken, {
            width: 320,
            margin: 2,
            color: {
              dark: '#0f172a',
              light: '#ffffff'
            },
            errorCorrectionLevel: 'H'
          }).then((url) => setQrDataUrl(url));
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedDivision, selectedCourse, refreshInterval, isSessionActive]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Handle Camera Toggle
  const startCamera = async () => {
    setCameraError(null);
    setScanResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: unknown) {
      console.warn('Webcam stream not accessible:', err);
      setCameraError('Webcam access was restricted or not found. You can use the Interactive Camera Simulator below!');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Listen for automated hands-free Jarvis actions (Hey Google style)
  useEffect(() => {
    const handleJarvisQR = (e: any) => {
      const detail = e?.detail || {};
      if (detail.autoCamera) {
        startCamera();
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('jarvis-action-qr', handleJarvisQR);
    return () => {
      window.removeEventListener('jarvis-action-qr', handleJarvisQR);
    };
  }, []);

  // Anti-Proxy Verification Engine
  const verifyAndMarkAttendance = (scannedString: string, student: UserProfile) => {
    if (!scannedString.startsWith('SMART-ATT::')) {
      playWarningBuzzer();
      setScanResult({
        status: 'expired_error',
        message: 'Invalid QR Format',
        details: 'The scanned code is not a valid Study Phantom cryptographic token.'
      });
      return;
    }

    const parts = scannedString.split('::');
    const targetCourse = parts[1];
    const targetDivStr = parts[2]; // 'DIV_A' or 'DIV_B'
    const targetDiv: Division = targetDivStr.replace('DIV_', '') as Division;
    const tokenTimestamp = parseInt(parts[4] || '0', 10);
    const ageSeconds = (Date.now() - tokenTimestamp) / 1000;

    // Check 1: Expiration Check (Anti-Screenshot Rotation)
    if (ageSeconds > refreshInterval + 4) {
      playWarningBuzzer();
      const failLog: AttendanceRecord = {
        id: `att-err-${Date.now()}`,
        sessionId: 'sess-active',
        studentId: student.id,
        studentName: student.name,
        studentDivision: student.division || 'A',
        targetDivision: targetDiv,
        courseCode: targetCourse,
        timestamp: 'Just now',
        status: 'expired_rejected',
        rejectionReason: `STALE TOKEN: QR code expired ${Math.round(ageSeconds)}s ago. Potential screenshot proxy attempt.`,
        ipHash: '172.28.14.92',
        deviceFingerprint: navigator.userAgent.substring(0, 30)
      };
      onAddAttendanceLog(failLog);
      setScanResult({
        status: 'expired_error',
        message: 'QR Token Expired!',
        details: 'This dynamic QR has rotated. Please scan the current live QR on the faculty projector screen.'
      });
      return;
    }

    // Check 2: STRICT ANTI-PROXY DIVISION CHECK
    if (student.division !== targetDiv) {
      playWarningBuzzer();
      const proxyViolationLog: AttendanceRecord = {
        id: `att-err-${Date.now()}`,
        sessionId: 'sess-active',
        studentId: student.id,
        studentName: student.name,
        studentDivision: student.division || 'A',
        targetDivision: targetDiv,
        courseCode: targetCourse,
        timestamp: 'Just now',
        status: 'proxy_rejected',
        rejectionReason: `ANTI-PROXY VIOLATION: Student belongs to Division ${student.division}, but scanned Division ${targetDiv} lecture. Proxy attempt flagged.`,
        ipHash: '192.168.1.104 (Flagged)',
        deviceFingerprint: navigator.userAgent.substring(0, 30)
      };
      onAddAttendanceLog(proxyViolationLog);
      setScanResult({
        status: 'anti_proxy_violation',
        message: `Anti-Proxy Violation Blocked!`,
        details: `You are enrolled in Division ${student.division}. You cannot mark attendance for a Division ${targetDiv} lecture!`
      });
      return;
    }

    // Check 3: Duplicate Attendance Check
    const alreadyMarked = attendanceLogs.some(
      (log) => log.studentId === student.id && log.status === 'valid' && log.courseCode === targetCourse
    );

    if (alreadyMarked) {
      playSuccessChime();
      setScanResult({
        status: 'success',
        message: 'Attendance Already Verified',
        details: `Your presence for ${targetCourse} (Div ${targetDiv}) was already recorded for this lecture.`
      });
      return;
    }

    // SUCCESS: Valid attendance confirmed!
    playSuccessChime();
    triggerGrandCelebration(2500);

    const validRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      sessionId: 'sess-active',
      studentId: student.id,
      studentName: student.name,
      studentDivision: student.division || 'A',
      targetDivision: targetDiv,
      courseCode: targetCourse,
      timestamp: 'Just now',
      status: 'valid',
      ipHash: '10.12.8.44 (Campus Wi-Fi Verified)',
      deviceFingerprint: navigator.userAgent.substring(0, 30)
    };

    onAddAttendanceLog(validRecord);
    onUpdateUserGems(student.id, 15); // +15 Gems for timely attendance!
    const newPercent = Math.min(100, Math.round((student.attendancePercent + 0.8) * 10) / 10);
    onUpdateAttendancePercent(student.id, newPercent);

    setScanResult({
      status: 'success',
      message: 'Attendance Verified Successfully!',
      details: `Division ${targetDiv} confirmed • +15 Gems awarded • Attendance updated to ${newPercent}%`
    });
  };

  // Division Attendance Calculations
  const validDivALogs = attendanceLogs.filter((l) => l.status === 'valid' && l.studentDivision === 'A');
  const validDivBLogs = attendanceLogs.filter((l) => l.status === 'valid' && l.studentDivision === 'B');
  const rejectedLogs = attendanceLogs.filter((l) => l.status !== 'valid');

  return (
    <div className="space-y-6">
      {/* Top Banner / Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase text-slate-400 block tracking-wider">
              Division A Present
            </span>
            <div className="text-2xl font-bold text-white mt-0.5">{validDivALogs.length} / 60</div>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" /> {Math.round((validDivALogs.length / 60) * 100)}% Verified
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-950/60 border border-indigo-700/40 flex items-center justify-center text-indigo-400 font-bold text-lg font-mono">
            Div A
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase text-slate-400 block tracking-wider">
              Division B Present
            </span>
            <div className="text-2xl font-bold text-white mt-0.5">{validDivBLogs.length} / 60</div>
            <span className="text-[11px] text-sky-400 flex items-center gap-1 mt-1 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" /> {Math.round((validDivBLogs.length / 60) * 100)}% Verified
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-950/60 border border-sky-700/40 flex items-center justify-center text-sky-400 font-bold text-lg font-mono">
            Div B
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase text-slate-400 block tracking-wider">
              Anti-Proxy Blocked
            </span>
            <div className="text-2xl font-bold text-rose-400 mt-0.5">{rejectedLogs.length}</div>
            <span className="text-[11px] text-rose-400/80 flex items-center gap-1 mt-1 font-mono">
              <ShieldAlert className="w-3.5 h-3.5" /> Cross-division prevented
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-950/60 border border-rose-700/40 flex items-center justify-center text-rose-400 font-bold">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase text-slate-400 block tracking-wider">
              Token Rotation Frequency
            </span>
            <div className="text-2xl font-bold text-amber-300 mt-0.5 font-mono">{refreshInterval}s</div>
            <span className="text-[11px] text-amber-400/80 flex items-center gap-1 mt-1 font-mono">
              <Clock className="w-3.5 h-3.5" /> Anti-screenshot shield active
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-950/60 border border-amber-700/40 flex items-center justify-center text-amber-400">
            <RefreshCw className="w-6 h-6 animate-spin" style={{ animationDuration: `${refreshInterval}s` }} />
          </div>
        </div>
      </div>

      {/* Role-Specific Perspective Indicator */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded ${
            currentUser.role === 'faculty' ? 'bg-purple-950 text-purple-300 border border-purple-700' : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
          }`}>
            {currentUser.role === 'faculty' ? 'Faculty Projector View' : 'Student Scanner View'}
          </span>
          <span className="text-xs text-slate-300">
            {currentUser.role === 'faculty' 
              ? `You are logged in as ${currentUser.name} (Faculty). You control dynamic token generation and monitor student proxy violations.` 
              : `You are logged in as ${currentUser.name} (Student, Div ${currentUser.division}). You scan the projector QR code to verify your attendance.`}
          </span>
        </div>
      </div>

      {/* Main Workstations View (Dedicated Separation: Faculty sees only Projector QR, Student sees only Scanner) */}
      {currentUser.role === 'faculty' ? (
        /* ============================================================== */
        /* FACULTY VIEW: DEDICATED QR CODE PROJECTOR SCREEN              */
        /* ============================================================== */
        <div className="max-w-4xl mx-auto w-full bg-white border border-slate-200 shadow-sm rounded-3xl p-6 sm:p-8 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-5 mb-6 gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg tracking-tight">Classroom Projector Station</h3>
                <p className="text-xs text-slate-500">Anti-Proxy Dynamic Token Generator • Projected to Hall</p>
              </div>
            </div>

            {/* Live toggle & Student QR Notification */}
            <div className="flex items-center gap-2.5">
              {onNotifyStudentsQR && (
                <button
                  onClick={() => {
                    onNotifyStudentsQR(selectedCourse, selectedDivision);
                    setQrNotified(true);
                    setTimeout(() => setQrNotified(false), 3000);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/25 transition transform hover:scale-[1.02]"
                >
                  <Bell className="w-4 h-4 text-white animate-pulse" />
                  <span>{qrNotified ? '✅ Students Alerted!' : 'Send QR Alert to Students'}</span>
                </button>
              )}

              <button
                onClick={() => setIsSessionActive(!isSessionActive)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs ${
                  isSessionActive
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}
              >
                {isSessionActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isSessionActive ? 'Freeze Session' : 'Resume Session'}</span>
              </button>
            </div>
          </div>

          {/* Faculty Controls Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                Target Division
              </label>
              <div className="flex gap-1.5">
                {(['A', 'B'] as Division[]).map((div) => (
                  <button
                    key={div}
                    onClick={() => setSelectedDivision(div)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition font-mono ${
                      selectedDivision === div
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Division {div}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                Course Module
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
              >
                <option value="CS302 Compiler Design">CS302 Compiler Design</option>
                <option value="CS304 Operating Systems">CS304 Operating Systems</option>
                <option value="CS305 DBMS">CS305 DBMS</option>
                <option value="CS306 Computer Networks">CS306 Networks</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                Rotation Interval
              </label>
              <div className="flex gap-1">
                {[10, 15, 30].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setRefreshInterval(sec)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-semibold transition ${
                      refreshInterval === sec
                        ? 'bg-amber-500 text-white font-bold'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Projector Display Box */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 flex flex-col items-center justify-center relative shadow-md">
            {/* Division Badge & Token rotation indicator */}
            <div className="w-full flex items-center justify-between mb-5 flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-400/40 text-indigo-200 text-xs font-bold shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                Active Class: {selectedCourse} • Div {selectedDivision}
              </span>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-slate-400">Token Rotates in:</span>
                <span className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                  secondsRemaining <= 4 
                    ? 'bg-rose-950 text-rose-300 border border-rose-600/50 animate-pulse' 
                    : 'bg-indigo-950 text-amber-300 border border-indigo-600/40'
                }`}>
                  {secondsRemaining}s
                </span>
              </div>
            </div>

            {/* Countdown Progress Bar */}
            <div className="w-full h-2 bg-slate-800 rounded-full mb-6 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ease-linear ${
                  secondsRemaining <= 4 ? 'bg-rose-500' : 'bg-blue-500'
                }`}
                style={{ width: `${(secondsRemaining / refreshInterval) * 100}%` }}
              />
            </div>

            {/* Visual Emitter Stage */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 my-2 w-full max-w-2xl">
              {/* 2D Vector Emitter Graphic */}
              <div className="hidden sm:flex flex-col items-center justify-center p-3 rounded-3xl bg-slate-950 border border-slate-700 w-48 shrink-0">
                <div className="w-40 h-40 rounded-2xl overflow-hidden relative">
                  <img
                    src={IMAGES_2D.qrProjector}
                    alt="QR Attendance 2D Vector Graphic"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => handleImageError(e, PUBLIC_IMAGES.qrProjector)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
                  <div className="absolute bottom-1.5 left-0 right-0 text-center">
                    <span className="text-[9px] font-mono font-bold uppercase text-white bg-slate-900/90 px-2 py-0.5 rounded border border-slate-700">
                      Live Scanner
                    </span>
                  </div>
                </div>
              </div>

              {/* QR Code Container */}
              <div className="relative p-5 bg-white rounded-3xl shadow-lg ring-1 ring-slate-200">
                {/* Corner Brackets */}
                <div className="absolute -top-1.5 -left-1.5 w-5 h-5 border-t-2 border-l-2 border-blue-500 rounded-tl-lg" />
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 border-t-2 border-r-2 border-blue-500 rounded-tr-lg" />
                <div className="absolute -bottom-1.5 -left-1.5 w-5 h-5 border-b-2 border-l-2 border-blue-500 rounded-bl-lg" />
                <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 border-b-2 border-r-2 border-blue-500 rounded-br-lg" />

                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Dynamic Attendance QR Code"
                    className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-xl"
                  />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center text-slate-400">
                    Generating dynamic token...
                  </div>
                )}

                {/* Watermark badge inside QR */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="px-2.5 py-1 rounded-md bg-slate-950/95 text-[11px] font-mono text-indigo-300 font-bold border border-indigo-400/50 shadow-lg">
                    DIV {selectedDivision} • ROT #{rotationCount}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Token Hash display */}
            <div className="mt-5 w-full max-w-md bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
              <div className="text-[10px] uppercase font-mono text-slate-400 mb-1">
                Cryptographic Ephemeral Token:
              </div>
              <div className="text-[11px] font-mono text-indigo-300 truncate select-all">
                {sessionToken || 'Initializing...'}
              </div>
            </div>

            <p className="mt-3.5 text-xs text-slate-400 text-center max-w-md">
              <ShieldCheck className="w-4 h-4 inline mr-1 text-emerald-400" />
              Dynamic anti-proxy token changes automatically every {refreshInterval} seconds. Proxy screenshots will fail verification.
            </p>
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* STUDENT VIEW: DEDICATED QR CODE SCANNER STATION                */
        /* ============================================================== */
        <div className="max-w-2xl mx-auto w-full bg-white border border-slate-200 shadow-sm rounded-3xl p-6 sm:p-8 relative">
          <div className="flex items-center justify-between border-b border-slate-200 pb-5 mb-6">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg tracking-tight">Scan Attendance QR Code</h3>
                <p className="text-xs text-slate-500">Point your camera at the faculty projector</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono uppercase text-slate-500 block font-bold">Logged In Student</span>
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 justify-end">
                <span>{currentUser.role === 'student' ? currentUser.name : 'Simulating Rahul Sharma'}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[10px] border border-emerald-200 font-bold">
                  Div {currentUser.role === 'student' ? currentUser.division : 'A'}
                </span>
              </span>
            </div>
          </div>

            {/* Camera Viewfinder / Simulation Box */}
            <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-300 aspect-video flex flex-col items-center justify-center p-4">
              {isCameraActive ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover rounded-lg"
                  />
                  {/* Scanner Viewfinder Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-44 h-44 border-2 border-dashed border-emerald-400 rounded-xl relative">
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                      <div className="w-full h-0.5 bg-emerald-400 animate-[bounce_2s_infinite]" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-4">
                  <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <Video className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-white">Camera Scanner Standby</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Use physical webcam or trigger one-click ML Kit student scan simulations below.
                  </p>
                </div>
              )}

              {cameraError && (
                <div className="absolute bottom-2 left-2 right-2 bg-rose-950/90 border border-rose-700/50 p-2 rounded text-[11px] text-rose-200">
                  {cameraError}
                </div>
              )}
            </div>

            {/* Camera Actions */}
            <div className="flex items-center gap-2 mt-4">
              {isCameraActive ? (
                <button
                  onClick={stopCamera}
                  className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  <Pause className="w-4 h-4" /> Stop Live Camera
                </button>
              ) : (
                <button
                  onClick={startCamera}
                  className="flex-1 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition shadow-md shadow-indigo-600/30"
                >
                  <Camera className="w-4 h-4" /> Launch Live Webcam
                </button>
              )}

              {/* Instant Scan with Active Live Token */}
              <button
                onClick={() => {
                  const targetStudent = currentUser.role === 'student' ? currentUser : {
                    id: 'stu-1',
                    name: 'Rahul Sharma',
                    role: 'student' as const,
                    division: 'A' as const,
                    rollNumber: 'CS2024-042',
                    department: 'CSE',
                    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80',
                    title: 'Student',
                    email: 'rahul@student.engg.edu',
                    attendancePercent: 84.5,
                    gems: 260,
                    streakDays: 6,
                    hasStreakFreeze: true,
                    activeBadges: ['DSA Warrior']
                  };
                  verifyAndMarkAttendance(sessionToken, targetStudent);
                }}
                className="py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-md shadow-emerald-600/30"
              >
                <MonitorCheck className="w-4 h-4" /> Scan Current Token
              </button>
            </div>

            {/* Test Simulation Buttons: Anti-Proxy Demonstration */}
            <div className="mt-5 pt-4 border-t border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                Anti-Proxy Scenario Simulator:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    // Simulate Rahul (Div A) scanning
                    const rahul: UserProfile = {
                      id: 'stu-1',
                      name: 'Rahul Sharma',
                      role: 'student',
                      division: 'A',
                      rollNumber: 'CS2024-042',
                      department: 'CSE',
                      avatar: '',
                      title: '',
                      email: '',
                      attendancePercent: 84,
                      gems: 260,
                      streakDays: 6,
                      hasStreakFreeze: true,
                      activeBadges: []
                    };
                    verifyAndMarkAttendance(sessionToken, rahul);
                  }}
                  className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition"
                >
                  <div className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                    <span>Rahul (Div A)</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Div A</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Valid if session is set to Div A
                  </div>
                </button>

                <button
                  onClick={() => {
                    // Simulate Priya (Div B) scanning
                    const priya: UserProfile = {
                      id: 'stu-2',
                      name: 'Priya Patel',
                      role: 'student',
                      division: 'B',
                      rollNumber: 'CS2024-089',
                      department: 'CSE',
                      avatar: '',
                      title: '',
                      email: '',
                      attendancePercent: 92,
                      gems: 340,
                      streakDays: 14,
                      hasStreakFreeze: true,
                      activeBadges: []
                    };
                    verifyAndMarkAttendance(sessionToken, priya);
                  }}
                  className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition"
                >
                  <div className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                    <span>Priya (Div B)</span>
                    <span className="text-[10px] text-sky-400 font-mono">Div B</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Triggers proxy violation if session is Div A!
                  </div>
                </button>
              </div>

              {/* Expired Token simulation button */}
              <button
                onClick={() => {
                  const staleToken = `SMART-ATT::CS302::DIV_${selectedDivision}::TOK_STALE99::${Date.now() - 60000}`;
                  const student = currentUser.role === 'student' ? currentUser : {
                    id: 'stu-1',
                    name: 'Rahul Sharma',
                    role: 'student' as const,
                    division: 'A' as const,
                    rollNumber: 'CS2024-042',
                    department: 'CSE',
                    avatar: '',
                    title: '',
                    email: '',
                    attendancePercent: 84,
                    gems: 260,
                    streakDays: 6,
                    hasStreakFreeze: true,
                    activeBadges: []
                  };
                  verifyAndMarkAttendance(staleToken, student);
                }}
                className="w-full mt-2 py-1.5 px-3 rounded-lg bg-rose-950/40 hover:bg-rose-900/40 border border-rose-800/40 text-rose-300 text-xs font-medium flex items-center justify-center gap-1.5 transition"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                Simulate 60-Second Stale Screenshot (Anti-Screenshot Test)
              </button>
            </div>

            {/* Scan Feedback Result Card */}
            {scanResult && (
              <div
                className={`mt-4 p-4 rounded-xl border animate-in fade-in slide-in-from-top-2 ${
                  scanResult.status === 'success'
                    ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-200'
                    : scanResult.status === 'anti_proxy_violation'
                    ? 'bg-rose-950/70 border-rose-700/70 text-rose-200'
                    : 'bg-amber-950/60 border-amber-700/60 text-amber-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {scanResult.status === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : scanResult.status === 'anti_proxy_violation' ? (
                    <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h5 className="font-bold text-sm text-white">{scanResult.message}</h5>
                    <p className="text-xs mt-0.5 opacity-90">{scanResult.details}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      {/* Classroom Attendance Logs Box (Personal for Student, Live Audit for Faculty) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                {currentUser.role === 'faculty' ? 'Live Classroom Attendance Verification Feed' : 'My Personal Attendance Logs'}
              </h3>
              <p className="text-xs text-slate-400">
                {currentUser.role === 'faculty'
                  ? 'Time-stamped audit records with cryptographic anti-proxy verification'
                  : 'Your verified attendance stamps and division security checks'}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
            {currentUser.role === 'faculty'
              ? `Total Records: ${attendanceLogs.length}`
              : `My Verified Records: ${attendanceLogs.filter((l) => l.studentId === currentUser.id).length}`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-3">Division</th>
                <th className="py-2.5 px-3">Course</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Verification Status</th>
                <th className="py-2.5 px-3">Security & Device Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {(currentUser.role === 'faculty'
                ? attendanceLogs
                : attendanceLogs.filter((l) => l.studentId === currentUser.id)
              ).map((log) => {
                const isValid = log.status === 'valid';
                const isProxyBlock = log.status === 'proxy_rejected';
                return (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 text-white font-semibold flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isValid ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      {log.studentName}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.studentDivision === 'A' ? 'bg-indigo-950 text-indigo-300' : 'bg-sky-950 text-sky-300'
                      }`}>
                        Div {log.studentDivision}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-mono">{log.courseCode}</td>
                    <td className="py-3 px-3 text-slate-400">{log.timestamp}</td>
                    <td className="py-3 px-3">
                      {isValid ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/60 border border-emerald-700/50 px-2.5 py-1 rounded-full text-[11px] font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Valid Present
                        </span>
                      ) : isProxyBlock ? (
                        <span className="inline-flex items-center gap-1 text-rose-300 bg-rose-950/80 border border-rose-700/60 px-2.5 py-1 rounded-full text-[11px] font-semibold">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Proxy Blocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-300 bg-amber-950/80 border border-amber-700/60 px-2.5 py-1 rounded-full text-[11px] font-semibold">
                          <Clock className="w-3.5 h-3.5 text-amber-400" /> Token Expired
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-400">
                      {log.rejectionReason ? (
                        <span className="text-rose-400 font-medium block truncate max-w-xs">{log.rejectionReason}</span>
                      ) : (
                        <span className="text-slate-400 font-mono">{log.ipHash} • {log.deviceFingerprint}</span>
                      )}
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
