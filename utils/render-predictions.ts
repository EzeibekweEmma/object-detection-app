// Preload the audio file and set a flag to manage sound playing
let canPlaySound = true;

const playSound = () => {
  if (canPlaySound) {
    const alertSound = new Audio('/alert.mp3');
    alertSound.play();

    canPlaySound = false;
    setTimeout(() => {
      canPlaySound = true;
    }, 7000); // 7 seconds interval
  }
};

export const renderPredictions = (predictions: any[], ctx: any, alertToObject: string) => {
  // Clear the canvas
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.textBaseline = 'bottom';

  predictions.forEach((prediction) => {
    const objectDetected = prediction.class === alertToObject.toLowerCase().trim()
    const [x, y, width, height] = prediction['bbox'];
    const result = `${prediction.class}: ${(prediction.score * 100).toFixed(
      1
    )}%`;

    // bounding box
    ctx.strokeStyle = ctx.fillStyle = "#22c55e";
    ctx.lineWidth = 1;

    // Draw the bounding box
    ctx.strokeRect(x, y, width, height);

    // Set the text background to green
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(x, y - 20, ctx.measureText(result).width + 10, 20);

    // Set the text color to white
    ctx.fillStyle = "#fff";
    ctx.fillText(result, x + 5, y - 4);

    // Play the alert sound if a person is detected
    if (objectDetected) playSound();
  });
};