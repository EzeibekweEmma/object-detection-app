import type { Detection } from '@/utils/detection-types';

let alertSound: HTMLAudioElement | null = null;
let lastAlertAt = 0;

const ALERT_COOLDOWN_MS = 7_000;

const playSound = () => {
  const now = Date.now();
  if (now - lastAlertAt < ALERT_COOLDOWN_MS) return;

  alertSound ??= new Audio('/alert.mp3');
  lastAlertAt = now;
  void alertSound.play().catch(() => {
    // Browsers can block audio until the user interacts with the page.
  });
};

export const renderPredictions = (
  predictions: Detection[],
  ctx: CanvasRenderingContext2D,
  alertToObject: string,
  mirrored = false
) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.textBaseline = 'bottom';
  ctx.font = '14px sans-serif';

  const alertTarget = alertToObject.toLowerCase().trim();

  predictions.forEach((prediction) => {
    const objectDetected =
      alertTarget.length > 0 && prediction.class.toLowerCase() === alertTarget;
    const [x, y, width, height] = prediction.bbox;
    const displayX = mirrored ? ctx.canvas.width - x - width : x;
    const result = `${prediction.class}: ${(prediction.score * 100).toFixed(
      1
    )}%`;

    ctx.strokeStyle = objectDetected ? '#facc15' : '#22c55e';
    ctx.lineWidth = objectDetected ? 3 : 2;

    ctx.strokeRect(displayX, y, width, height);

    const labelWidth = ctx.measureText(result).width + 10;
    const labelY = Math.max(y - 22, 0);
    ctx.fillStyle = objectDetected ? '#ca8a04' : '#16a34a';
    ctx.fillRect(displayX, labelY, labelWidth, 22);

    ctx.fillStyle = '#fff';
    ctx.fillText(result, displayX + 5, labelY + 18);

    if (objectDetected) playSound();
  });
};
