export const renderPredictions = (predictions: any[], ctx: any) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Fonts
  // const font = '12px';
  ctx.textBaseline = 'bottom';

  predictions.forEach((prediction) => {
    const [x, y, width, height] = prediction['bbox'];
    const result = `${prediction.class}: ${(prediction.score * 100).toFixed(
      1
    )}%`;

    // bounding box
    ctx.strokeStyle = ctx.fillStyle = '#68fc85';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);
    ctx.fillText(result, x - 1, y - 2);
  });
};
