import confetti from 'canvas-confetti';

/**
 * Multi-stage grand celebration fireworks using canvas-confetti
 */
export function triggerGrandCelebration(durationMs = 3500) {
  const animationEnd = Date.now() + durationMs;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  // Initial cannon burst from corners
  confetti({
    particleCount: 80,
    angle: 60,
    spread: 70,
    origin: { x: 0.1, y: 0.8 },
    colors: ['#6366f1', '#ec4899', '#3b82f6', '#10b981', '#f59e0b']
  });
  confetti({
    particleCount: 80,
    angle: 120,
    spread: 70,
    origin: { x: 0.9, y: 0.8 },
    colors: ['#6366f1', '#ec4899', '#3b82f6', '#10b981', '#f59e0b']
  });

  // Continuous fireworks cascades
  const interval: ReturnType<typeof setInterval> = setInterval(function () {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleCount = 45 * (timeLeft / durationMs);

    // Left firework starburst
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.4), y: Math.random() - 0.2 },
      colors: ['#4f46e5', '#818cf8', '#38bdf8', '#34d399', '#fbbf24', '#f43f5e']
    });

    // Right firework starburst
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.6, 0.9), y: Math.random() - 0.2 },
      colors: ['#4f46e5', '#818cf8', '#38bdf8', '#34d399', '#fbbf24', '#f43f5e']
    });
  }, 250);
}

/**
 * Compact celebratory burst for everyday achievements
 */
export function triggerQuickSparkle() {
  confetti({
    particleCount: 40,
    spread: 60,
    origin: { y: 0.7 },
    colors: ['#6366f1', '#a855f7', '#ec4899', '#38bdf8']
  });
}
