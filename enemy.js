// enemy.js
import Bullet from "./bullet.js"; // Import Bullet class

export default class Enemy {
    // Remove waveCount parameter from constructor
    constructor(game, x, y) {
        this.game = game;
        
        // Scale enemy size based on canvas size for proportional appearance
        const baseSizeX = 40;
        const baseSizeY = 40;
        const scaleFactor = Math.min(game.width / 800, game.height / 600);
        
        this.width = Math.max(baseSizeX * scaleFactor, 25); // Minimum size
        this.height = Math.max(baseSizeY * scaleFactor, 25);
        
        this.x = x;
        this.y = y;
        // Set constant downward speed - INCREASED
        this.baseSpeedY = 80; // Adjusted base speed to medium difficulty
        this.speedY = this.baseSpeedY; // pixels per second downwards
        this.health = 1;
        this.scoreValue = 10;
        this.markedForDeletion = false;
        this.color = '#ff00ff'; // Magenta for viruses

        // Enemy shooting - Keep interval constant (no difficulty scaling)
        this.shootTimer = Math.random() * 5000 + 10000; // Initial shoot delay (10-15 seconds)
        this.shootInterval = 5000 + Math.random() * 5000; // Shoot every 5-10 seconds after first shot

        this.isFrozen = false;
        this.freezeTimer = 0;
        this.freezeDuration = 3000; // Freeze duration is 3 seconds
        this.frozenSpeedY = 0; // Store speed when frozen
        this.frozenSpeedX = 0; // Store horizontal speed when frozen

        // Horizontal movement properties for zig-zag - INCREASED
        this.baseSpeedX = 35; // Horizontal speed
        this.speedX = (Math.random() < 0.5 ? 1 : -1) * this.baseSpeedX; // Random initial direction
        this.horizontalChangeInterval = 1000 + Math.random() * 2000; // Change direction every 1-3 seconds
        this.horizontalTimer = 0;

         // Use pixel art sprite
         this.image = new Image();
         this.image.src = 'asset_enemy_virus.png'; // Use the asset path
         this.loaded = false;
         this.image.onload = () => this.loaded = true;
    }

    update(deltaTime) {
        if (this.isFrozen) {
            this.freezeTimer -= deltaTime;
            if (this.freezeTimer <= 0) {
                this.isFrozen = false;
                // Restore speed to what it was before freezing
                this.speedY = this.frozenSpeedY;
                 this.speedX = this.frozenSpeedX; // Restore horizontal speed
                 this.color = '#ff00ff'; // Unfreeze, reset color
            }
             // If frozen, don't move or shoot
             return;
        }

        // Apply vertical movement
        this.y += this.speedY * (deltaTime / 1000); // deltaTime in seconds

        // Apply horizontal movement and handle zig-zag
        this.x += this.speedX * (deltaTime / 1000);
        this.horizontalTimer += deltaTime;

        if (this.horizontalTimer >= this.horizontalChangeInterval) {
             this.speedX *= -1; // Reverse horizontal direction
             this.horizontalTimer = 0; // Reset timer
             this.horizontalChangeInterval = 1000 + Math.random() * 2000; // New random interval
        }

         // Keep enemy within horizontal bounds while zig-zagging
         if (this.x <= 0 || this.x + this.width >= this.game.width) {
             this.speedX *= -1; // Reverse if hitting boundary
             // Adjust position slightly to prevent sticking to edge
             this.x = Math.max(0, Math.min(this.x, this.game.width - this.width));
         }

        // Check if enemy is off screen
        if (this.y > this.game.height) {
            this.markedForDeletion = true;
            // Optionally penalize player for letting enemies pass
            // this.game.player.lives--; // Removed penalty for now
        }

        // Enemy shooting
        this.shootTimer += deltaTime;
        if (this.shootTimer >= this.shootInterval) {
            this.shoot();
            this.shootTimer = 0;
            this.shootInterval = 5000 + Math.random() * 5000; // Reset interval
        }
    }

    render(ctx) {
        // Draw enemy (binary block / glitchy creature)
        if (this.loaded) {
             ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
             // Fallback to rectangle
             ctx.fillStyle = this.color;
             ctx.fillRect(this.x, this.y, this.width, this.height);
        }

         // Draw freeze indicator (optional)
         if (this.isFrozen) {
              ctx.fillStyle = 'rgba(0, 255, 255, 0.3)'; // Semi-transparent cyan overlay
              ctx.fillRect(this.x, this.y, this.width, this.height);
         }
    }

    hit(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.markedForDeletion = true;
        }
    }

    shoot() {
        // Create an enemy bullet
        this.game.enemyBullets.push(new Bullet(this.game, this.x + this.width / 2, this.y + this.height, 1)); // direction = 1 (downwards)
         // sound? enemy shoot sound - add later maybe
    }

    freeze() {
        if (!this.isFrozen) { // Only freeze if not already frozen
            this.isFrozen = true;
            this.freezeTimer = this.freezeDuration;
            this.frozenSpeedY = this.speedY; // Store current speed
            this.frozenSpeedX = this.speedX; // Store current horizontal speed
            this.speedY = 0; // Stop vertical movement
             this.speedX = 0; // Stop horizontal movement when frozen
             this.color = '#00ffff'; // Change color when frozen
        }
    }
}
