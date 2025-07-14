// powerup.js
export default class PowerUp {
    constructor(game, x, y, type) {
        this.game = game;
        
        // Scale powerup size based on canvas size
        const baseSize = 25;
        const scaleFactor = Math.min(game.width / 800, game.height / 600);
        
        this.baseWidth = Math.max(baseSize * scaleFactor, 20);
        this.baseHeight = Math.max(baseSize * scaleFactor, 20);
        this.width = this.baseWidth;
        this.height = this.baseHeight;
        this.x = x;
        this.y = y;
        this.speedY = 100; // Falls downwards slowly
        this.markedForDeletion = false;
        this.type = type; // 'shield', 'tripleShot', 'bomb', 'speedBoost', 'freeze'
        this.color = this.getColorForType(type); // Assign color based on type

         // Use pixel art sprites
         this.image = new Image();
         this.image.src = this.getImagePathForType(type); // Get path based on type
         this.loaded = false;
         this.image.onload = () => {
             this.loaded = true;
             // Set size based on image, or keep base size
             this.width = this.baseWidth;
             this.height = this.baseHeight;
         };
    }

    getImagePathForType(type) {
        switch (type) {
            case 'shield': return 'asset_powerup_shield.png';
            case 'tripleShot': return 'asset_powerup_tripleshot.png';
            case 'bomb': return 'asset_powerup_bomb.png';
            case 'speedBoost': return 'asset_powerup_speed.png';
            case 'freeze': return 'asset_powerup_freeze.png';
            default: return ''; // Should not happen
        }
    }

    getColorForType(type) {
        switch (type) {
            case 'shield': return '#00ffff'; // Cyan
            case 'tripleShot': return '#ffff00'; // Yellow
            case 'bomb': return '#ff0000'; // Red
            case 'speedBoost': return '#00ff00'; // Green
            case 'freeze': return '#0000ff'; // Blue
            default: return '#ffffff'; // White
        }
    }

    update(deltaTime) {
        this.y += this.speedY * (deltaTime / 1000);

        // Mark for deletion if off screen
        if (this.y > this.game.height) {
            this.markedForDeletion = true;
        }
    }

    render(ctx) {
        // Draw power-up (pixel art or simple colored square)
        if (this.loaded) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
             // Fallback to color rectangle
             ctx.fillStyle = this.color;
             ctx.fillRect(this.x, this.y, this.width, this.height);

             // Draw initial letter of type (optional fallback)
             ctx.fillStyle = '#0a0a0a';
             ctx.font = '15px "Press Start 2P"';
             ctx.textAlign = 'center';
             ctx.textBaseline = 'middle';
             ctx.fillText(this.type.charAt(0).toUpperCase(), this.x + this.width / 2, this.y + this.height / 2 + 2);
        }
    }

    applyEffect(player) {
        switch (this.type) {
            case 'shield':
                player.activateShield();
                break;
            case 'tripleShot':
                player.activateTripleShot();
                break;
            case 'bomb':
                player.activateBomb();
                break;
            case 'speedBoost':
                player.activateSpeedBoost();
                break;
            case 'freeze':
                player.activateFreeze();
                break;
        }
         // Sound is played in player methods or game collision handler now
    }
}
