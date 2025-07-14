// bullet.js
export default class Bullet {
    constructor(game, x, y, direction, offsetX = 0) {
        this.game = game;
        
        // Scale bullet size based on canvas size for proportional appearance
        const baseWidthPlayer = 5;
        const baseHeightPlayer = 15;
        const baseWidthEnemy = 15;
        const baseHeightEnemy = 15;
        const scaleFactor = Math.min(game.width / 800, game.height / 600);
        
        if (direction === -1) { // Player bullet
            this.baseWidth = Math.max(baseWidthPlayer * scaleFactor, 3);
            this.baseHeight = Math.max(baseHeightPlayer * scaleFactor, 8);
        } else { // Enemy bullet
            this.baseWidth = Math.max(baseWidthEnemy * scaleFactor, 8);
            this.baseHeight = Math.max(baseHeightEnemy * scaleFactor, 8);
        }
        
        this.width = this.baseWidth;
        this.height = this.baseHeight;

        this.x = x - this.width / 2 + offsetX; // Center bullet horizontally + offset
        this.y = y;
        this.speed = 550; // pixels per second (INCREASED bullet speed)
        this.direction = direction; // -1 for player (up), 1 for enemy (down)
        this.color = direction === -1 ? '#00ff00' : '#ff0000'; // Green for player, Red for enemy
        this.markedForDeletion = false;

         this.isFrozen = false; // Bullets can also be frozen

         // Use pixel art sprites
         this.image = new Image();
         this.image.src = direction === -1 ? 'https://github.com/jairosaldanha/Spaceinvaders/blob/d89e5b68691360468525f69eb55c729c200b527f/asset_player_bullet.png' : 'https://github.com/jairosaldanha/Spaceinvaders/blob/d89e5b68691360468525f69eb55c729c200b527f/asset_enemy_bullet.png'; // Use respective asset paths
         this.loaded = false;
         this.image.onload = () => {
             this.loaded = true;
             // Update size based on potentially different aspect ratio of sprite
             // This might need careful handling if sprite aspect ratio doesn't match baseWidth/Height
             // For now, assume they match or scale to fit base size
             this.width = this.baseWidth;
             this.height = this.baseHeight;
         };
    }

    update(deltaTime) {
         if (this.isFrozen) {
              // If frozen, don't move
              return;
         }

        this.y += this.speed * this.direction * (deltaTime / 1000); // deltaTime in seconds

        // Mark for deletion if off screen
        if (this.y < -this.height || this.y > this.game.height + this.height) {
            this.markedForDeletion = true;
        }
    }

    render(ctx) {
        if (this.loaded) {
             ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
             // Fallback to color rectangle
             ctx.fillStyle = this.color;
             ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        // Optional: Visual indicator for frozen bullets
         if (this.isFrozen) {
             ctx.fillStyle = 'rgba(0, 255, 255, 0.2)'; // Light cyan overlay
             ctx.fillRect(this.x, this.y, this.width, this.height);
         }
    }

     freeze() {
         this.isFrozen = true;
     }

      unfreeze() {
         this.isFrozen = false;
      }
}
