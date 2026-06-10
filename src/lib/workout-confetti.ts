export async function fireWorkoutConfetti() {
  const confetti = (await import("canvas-confetti")).default;
  const duration = 2800;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.65 },
      colors: ["#f43f5e", "#8b5cf6", "#3b82f6", "#22c55e", "#eab308"],
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.65 },
      colors: ["#f43f5e", "#8b5cf6", "#3b82f6", "#22c55e", "#eab308"],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  confetti({
    particleCount: 120,
    spread: 100,
    origin: { y: 0.55 },
    startVelocity: 38,
    colors: ["#f43f5e", "#8b5cf6", "#3b82f6", "#22c55e", "#eab308", "#ffffff"],
  });

  frame();
}
