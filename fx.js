// fx.js
// Simple Canvas Glitch Effect
export function applyGlitchEffect(ctx, width, height) {
    const scanlineHeight = 2; // Height of scanlines
    const scanlineAlpha = 0.1; // Opacity of scanlines
    const glitchOffset = 10; // Max horizontal offset for glitches
    const glitchBandHeight = 20; // Height of glitch bands

    // 1. Apply scanlines - Currently commented out
    // ctx.fillStyle = 'rgba(0, 255, 0, ' + scanlineAlpha + ')';
    // for (let i = 0; i < height; i += scanlineHeight * 2) {
    //     ctx.fillRect(0, i, width, scanlineHeight);
    // }

    // 2. Apply random color shifts and horizontal offsets (more processor intensive)
    // A simpler way is to just draw distorted bands
    const numBands = Math.floor(height / glitchBandHeight);
    for (let i = 0; i < numBands; i++) {
        const y = i * glitchBandHeight + Math.random() * glitchBandHeight;
        const h = Math.random() * glitchBandHeight * 0.5 + glitchBandHeight * 0.5;
        const xOffset = (Math.random() - 0.5) * glitchOffset * 2;

        // Randomly shift color channels or just use a single color
        // ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`;
         ctx.fillStyle = `rgba(0, 255, 0, 0.2)`; // Green transparent glitch band

        // Get the current image data for this band
        // This approach requires reading pixel data which is slow
        // Instead, we can manipulate the canvas transform or draw distorted shapes

        // Simple distortion: draw a rectangle with an offset
        ctx.fillRect(xOffset, y, width, h);

        // More advanced: draw parts of the screen with offset
        // Need to save and restore context if manipulating transform significantly per band
         // ctx.save();
         // ctx.translate(xOffset, 0);
         // ctx.drawImage(ctx.canvas, 0, y, width, h, 0, y, width, h);
         // ctx.restore();
    }

     // Add some random static/noise
     ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
     for(let i = 0; i < 50; i++) { // Draw 50 random static squares
         const sx = Math.random() * width;
         const sy = Math.random() * height;
         const size = Math.random() * 5 + 2;
         ctx.fillRect(sx, sy, size, size);
     }

    // 3. Optional: Apply a small overall displacement or scale - Currently commented out
    // ctx.translate((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2);
    // ctx.scale(1 + (Math.random() - 0.5) * 0.02, 1 + (Math.random() - 0.5) * 0.02);

    // Remember to reset transform if you apply global transformations - Not needed with current approach
    // ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform after rendering frame
}