// Centralized 2D Vector & Editorial Image Assets for Study Phantom Ecosystem
// Using direct ESM imports so Vite bundles and hashes them permanently for both dev and production builds
import heroCommandImg from './hero_campus_vector_2d_1794210393619.jpg';
import classroomVaultImg from './classroom_vault_vector_2d_1794210393782.jpg';
import qrProjectorImg from './qr_attendance_vector_2d_1794210395510.jpg';
import labSubmissionImg from './lab_coding_vector_2d_1794210395765.jpg';
import studyNotesImg from './study_notes_vector_2d_1794210396773.jpg';
import aiNeuralCoreImg from './ai_tutor_vector_2d_1794210397531.jpg';
import trophyGemsImg from './trophy_gems_vector_2d_1794210396973.jpg';

// Public path fallbacks (served statically from /public/images/)
export const PUBLIC_IMAGES = {
  heroCommand: '/images/hero_campus_vector_2d_1794210393619.jpg',
  classroomVault: '/images/classroom_vault_vector_2d_1794210393782.jpg',
  qrProjector: '/images/qr_attendance_vector_2d_1794210395510.jpg',
  labSubmission: '/images/lab_coding_vector_2d_1794210395765.jpg',
  studyNotes: '/images/study_notes_vector_2d_1794210396773.jpg',
  aiNeuralCore: '/images/ai_tutor_vector_2d_1794210397531.jpg',
  trophyGems: '/images/trophy_gems_vector_2d_1794210396973.jpg',
  focusTimer: '/images/ai_tutor_vector_2d_1794210397531.jpg',
} as const;

export const IMAGES_2D = {
  heroCommand: heroCommandImg,
  classroomVault: classroomVaultImg,
  qrProjector: qrProjectorImg,
  labSubmission: labSubmissionImg,
  studyNotes: studyNotesImg,
  aiNeuralCore: aiNeuralCoreImg,
  trophyGems: trophyGemsImg,
  focusTimer: aiNeuralCoreImg,
} as const;

// Helper to ensure an image element never displays a broken icon or disappears
export const handleImageError = (
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackPublicUrl?: string
) => {
  const target = e.currentTarget;
  if (fallbackPublicUrl && target.src !== fallbackPublicUrl && !target.src.endsWith(fallbackPublicUrl)) {
    target.src = fallbackPublicUrl;
    return;
  }
  // If even fallback fails, render an elegant inline SVG placeholder so it never disappears
  target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%232563eb" font-family="sans-serif" font-weight="bold" font-size="16">Study Phantom Illustration</text></svg>';
};

// Backward-compatible alias for existing imports
export const IMAGES_3D = IMAGES_2D;
