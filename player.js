// player.js
export default class Player {
    constructor(game) {
        this.game = game;
        this.width = 50;
        this.height = 50;
        this.x = this.game.width / 2 - this.width / 2;
        this.y = this.game.height - this.height - 10; // Position near the bottom
        this.speed = 380; // pixels per second (increased speed)
        this.currentSpeed = this.speed;
        this.lives = 3;
        this.color = '#00ff00';

        this.isShooting = false;
        this.shootCooldown = 150; // milliseconds between shots (reduced cooldown = faster fire rate)
        this.shootTimer = 0;

        // Power-up states
        this.isShielded = false;
        this.shieldDuration = 5000; // 5 seconds
        this.shieldTimer = 0;

        this.tripleShotActive = false;
        this.tripleShotDuration = 10000; // 10 seconds
        this.tripleShotTimer = 0;

        this.bombActive = false; // Bomb is instant, not timed
        this.freezeActive = false; // Freeze is instant, not timed

        this.speedBoostActive = false;
        this.speedBoostDuration = 7000; // 7 seconds
        this.speedBoostTimer = 0;
        this.speedBoostAmount = 1.5; // 50% speed increase (applied to new base speed)

        // Use pixel art sprite
        this.image = new Image();
        this.image.src = '/asset_player.png'; // Use the asset path
        this.loaded = false;
        this.image.onload = () => this.loaded = true;
    }

    // Updated resize to push the player higher on mobile screens
    resize(width, height) {
        this.game.width = width;
        this.game.height = height;
        
        // On mobile, reserve more bottom space so the ship stays clear of controls
        const isMobileLayout = window.innerWidth <= 768;
        const bottomMarginRatio = isMobileLayout ? 0.2 : 0.1; // 20% of canvas height on mobile, 10% on desktop
        const bottomMargin = height * bottomMarginRatio;
        
        // Initial position (before scaling)
        this.y = this.game.height - this.height - bottomMargin;
        // Keep within horizontal bounds
        this.x = Math.min(Math.max(this.x, 0), this.game.width - this.width);
        
        // Scale the ship size proportionally
        const baseSize = 50;
        const scaleFactor = Math.min(width / 800, height / 600);
        const newSize = Math.max(baseSize * scaleFactor, 30);
        this.width = newSize;
        this.height = newSize;
        
        // Reapply position after resizing
        this.y = this.game.height - this.height - bottomMargin;
        this.x = Math.min(Math.max(this.x, 0), this.game.width - this.width);
    }

    update(deltaTime) { // No longer need keys or mobileX passed directly
        // Get input state from the handler
        const inputState = this.game.inputHandler.getState();

        // Movement
        let moveX = inputState.moveDirection; // -1, 0, or 1 based on combined input

        this.x += moveX * this.currentSpeed * (deltaTime / 1000); // deltaTime in seconds

        // Keep player within bounds
        this.x = Math.max(0, Math.min(this.x, this.game.width - this.width));

        // Handle shooting cooldown
        if (this.shootTimer > 0) {
            this.shootTimer -= deltaTime;
        } else {
            this.isShooting = false; // Allow shooting again after cooldown
        }

        // Shooting is now triggered by click listeners in main.js/inputHandler.js
        // which call game.handleShoot(). We just manage the cooldown here.

        // Update power-up timers
        if (this.isShielded) {
            this.shieldTimer -= deltaTime;
            if (this.shieldTimer <= 0) {
                this.isShielded = false;
            }
        }
        if (this.tripleShotActive) {
            this.tripleShotTimer -= deltaTime;
            if (this.tripleShotTimer <= 0) {
                this.tripleShotActive = false;
            }
        }
        if (this.speedBoostActive) {
            this.speedBoostTimer -= deltaTime;
            if (this.speedBoostTimer <= 0) {
                this.speedBoostActive = false;
                this.currentSpeed = this.speed; // Reset speed
            }
        }
         // Freeze is instant, Bomb is instant - timers are not needed here
    }

    render(ctx) {
        // Draw player ship (digital craft/shield)
        if (this.loaded) {
             ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
             // Fallback to rectangle
             ctx.fillStyle = this.color;
             ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        // Draw lives - Draw this slightly above the player model
        ctx.fillStyle = '#ff0000'; // Red for lives
        ctx.font = '12px "Press Start 2P"';
        ctx.textAlign = 'center'; // Center text above player
        ctx.fillText(`Lives: ${this.lives}`, this.x + this.width/2, this.y - 5); // Position above player

        // Draw shield visual if active
        if (this.isShielded) {
            ctx.strokeStyle = '#00ffff'; // Cyan for shield
            ctx.lineWidth = 3;
            ctx.strokeRect(this.x - 5, this.y - 5, this.width + 10, this.height + 10);
        }

        // Draw power-up indicators (optional) - Could draw small icons above the player
    }

    hit(damage) {
        if (this.isShielded) {
            // Shield absorbs hit
             this.game.audioManager.playSound('glitch'); // Shield hit sound?
            return;
        }
        this.lives -= damage;
        if (this.lives <= 0) {
            // Game over logic handled in Game class
        }
    }

    startShootingCooldown() {
        this.shootTimer = this.shootCooldown;
        this.isShooting = true; // Set flag to prevent shooting during cooldown
    }

    // Power-up effects
    activateShield() {
        this.isShielded = true;
        this.shieldTimer = this.shieldDuration;
         this.game.audioManager.playSound('powerup'); // Use generic powerup sound for now
    }

    activateTripleShot() {
        this.tripleShotActive = true;
        this.tripleShotTimer = this.tripleShotDuration;
         this.game.audioManager.playSound('powerup');
    }

     activateBomb() {
         this.bombActive = true; // The bomb effect is handled immediately in the collision detection
         this.game.audioManager.playSound('powerup'); // Play powerup sound when collected
     }

     activateFreeze() {
         this.freezeActive = true; // The freeze effect is handled immediately in the collision detection
         this.game.audioManager.playSound('powerup');
     }

    activateSpeedBoost() {
        this.speedBoostActive = true;
        this.speedBoostTimer = this.speedBoostDuration;
        this.currentSpeed = this.speed * this.speedBoostAmount; // Apply speed boost
         this.game.audioManager.playSound('powerup');
    }
}