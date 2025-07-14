// securityFile.js
export default class SecurityFile {
    constructor(game, x, y) {
        this.game = game;
        
        // Scale file size based on canvas size
        const baseSize = 30;
        const scaleFactor = Math.min(game.width / 800, game.height / 600);
        
        this.width = Math.max(baseSize * scaleFactor, 25);
        this.height = Math.max(baseSize * scaleFactor, 25);
        
        this.x = x;
        this.y = y;
        this.markedForDeletion = false;
        this.color = '#ffffff'; // White for file

         // Files could pulse or move slightly to be noticeable
         this.pulseTimer = 0;
         this.pulseSpeed = 0.005; // Speed of pulse animation
         this.pulseScale = 0.1; // How much it scales

         // Add downward movement speed
         this.speedY = 50; // pixels per second

         // Use pixel art sprite
         this.image = new Image();
         this.image.src = 'https://github.com/jairosaldanha/Spaceinvaders/blob/8114bf28588adddc6ebfaab20c44f919e816232d/asset_security_file.png'; // Use the asset path
         this.loaded = false;
         this.image.onload = () => this.loaded = true;
    }

    update(deltaTime) {
         // Simple pulse animation
         this.pulseTimer += deltaTime * this.pulseSpeed;
         const scale = 1 + Math.sin(this.pulseTimer) * this.pulseScale;
         this.currentWidth = this.width * scale;
         this.currentHeight = this.height * scale;
         // Adjust position based on scaling to keep it centered around the original x,y
         this.currentX = this.x - (this.currentWidth - this.width) / 2;
         this.currentY = this.y - (this.currentHeight - this.height) / 2;

        // Add downward movement
        this.y += this.speedY * (deltaTime / 1000);

        // Mark for deletion if off screen
        if (this.y > this.game.height + this.height) {
             this.markedForDeletion = true;
        }
    }

    render(ctx) {
        // Draw security file (pixelated file icon)
        if (this.loaded) {
            // Draw image scaled for pulsing effect
             ctx.drawImage(this.image, this.currentX, this.currentY, this.currentWidth, this.currentHeight);
        } else {
             // Fallback to colored rectangle if image not loaded
             ctx.fillStyle = this.color;
             ctx.fillRect(this.currentX, this.currentY, this.currentWidth, this.currentHeight);

             // Draw a symbol on the file (optional)
             ctx.fillStyle = '#0a0a0a'; // Black text
             ctx.font = '20px "Press Start 2P"';
             ctx.textAlign = 'center';
             ctx.textBaseline = 'middle';
             ctx.fillText('F', this.x + this.width / 2, this.y + this.height / 2 + 2); // Draw 'F' for File
        }
    }
}
