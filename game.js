import Player from "./player.js";
import Enemy from "./enemy.js";
import Bullet from "./bullet.js";
import PowerUp from "./powerup.js";
import SecurityFile from "./securityFile.js";
import { applyGlitchEffect } from "./fx.js"; // Import the glitch effect function

export default class Game {
    constructor(width, height, inputHandler, audioManager) {
        this.width = width;
        this.height = height;
        this.inputHandler = inputHandler;
        this.audioManager = audioManager;
        this.uiElements = {}; // To hold UI elements passed from main.js

        // Player is created new each game
        this.player = new Player(this);

        // Arrays are reset on new game instance
        this.enemies = [];
        this.playerBullets = [];
        this.enemyBullets = [];
        this.powerUps = [];
        this.securityFiles = [];

        // Score and file count are reset
        this.score = 0;
        this.filesCollected = 0;
        this.filesToWin = 3;

        // Game state flags are reset
        this.gameOver = false;
        this.gameWin = false;
        // Flags to ensure game over/win sounds play only once per game instance
        this._gameOverSoundPlayed = false;
        this._winSoundPlayed = false;

        // Timers and counters are reset
        this.waveTimer = 0;
        this.waveCount = 0;
        this.fileTimer = 0;
        this.glitchTimer = 0;

        // Difficulty constants - these are set once in the constructor
        // and are NOT modified during gameplay (except maybe music tempo)
        this.waveInterval = 6000; // Spawn a new wave every 6 seconds
        this.enemiesPerWave = 5; // Number of enemies per wave
        this.fileInterval = 60000; // Spawn a new file every 60 seconds (1 minute)
        this.maxFilesOnScreen = 1; // Only one file at a time
        this.powerUpDropChance = 0.15; // 15% chance to drop a power-up
        this.glitchInterval = 5000; // Apply glitch effect every 5 seconds
        this.glitchDuration = 100; // Glitch lasts for 100ms

        // Initial check to spawn first file soon after game starts
        // Start timer at 0, first file will drop after fileInterval
        this.fileTimer = 0;

         // Reset music tempo in audio manager at the start of a new game
         if (this.audioManager) {
             this.audioManager.reset();
         }
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        // Adjust player position if needed based on new size
        this.player.resize(width, height);
        // Note: Existing entities positions are not updated on resize.
        // For a more robust game, entity positions should be relative or adjusted.
        // Given the fast-paced nature and short lifespan of entities, this might be acceptable.
    }

    update(deltaTime) {
        if (this.gameOver || this.gameWin) {
             // Ensure win/loss sounds are played only once if condition is met
             if(this.gameWin && !this._winSoundPlayed) {
                  // Sound played in main.js now
             }
             if(this.gameOver && !this._gameOverSoundPlayed) {
                  // Sound played in main.js now
             }
             return; // Stop updating game state if game is over
        }

        // Update Entities
        this.player.update(deltaTime); // Player reads input state directly
        // Update active bullets, enemies, powerups, and files
        this.playerBullets.forEach(bullet => bullet.update(deltaTime));
        this.enemyBullets.forEach(bullet => bullet.update(deltaTime));
        this.enemies.forEach(enemy => enemy.update(deltaTime));
        this.powerUps.forEach(powerUp => powerUp.update(deltaTime));
        this.securityFiles.forEach(file => file.update(deltaTime)); // Update file movement

        // Collision Detection and Filtering
        this.handleCollisions(); // This method now handles filtering marked entities

        // Spawn Waves
        this.waveTimer += deltaTime;
        if (this.waveTimer >= this.waveInterval) {
            this.spawnWave();
            this.waveTimer = 0;
            // Difficulty is NOT scaled here on subsequent waves
        }

        // Spawn Security Files
        this.fileTimer += deltaTime;
        // Only spawn if not already reached win condition and max files on screen not reached
        if (this.fileTimer >= this.fileInterval && this.securityFiles.length < this.maxFilesOnScreen && this.filesCollected < this.filesToWin) {
             this.spawnSecurityFile();
             this.fileTimer = 0; // Reset timer after spawning, regardless of whether one spawned
         }


        // Apply Glitch Effect periodically
        this.glitchTimer += deltaTime;
        // Check if it's time to START a glitch effect
        // The glitch effect should happen every `glitchInterval` duration *regardless* of the glitchDuration.
        // So, check if glitchTimer exceeds glitchInterval, play sound, reset timer, apply effect in render.
        if (this.glitchTimer >= this.glitchInterval) {
             this.glitchTimer = 0; // Reset timer immediately after interval is reached
             this.audioManager.playSound('glitch'); // Play sound when glitch starts
        }
         // The check for *rendering* the glitch should be `this.glitchTimer < this.glitchDuration`
         // This means the effect is drawn only for the specified short duration after the timer resets.


        // Check Win/Loss Condition
        if (this.player.lives <= 0 && !this.gameOver) { // Add !this.gameOver check to run only once
            this.gameOver = true;
            // Handle game over state cleanup/sound in main.js
        }
        if (this.filesCollected >= this.filesToWin && !this.gameWin) { // Add !this.gameWin check to run only once
            this.gameWin = true;
             // Handle win state cleanup/sound in main.js
        }

        // UI updates moved to main.js loop for clarity in rendering phase
        // this.uiElements.score.textContent = `SCORE: ${this.score}`;
        // this.uiElements.filesCollected.textContent = `FILES: ${this.filesCollected}/${this.filesToWin}`;
    }

    render(ctx) {
         // Clear canvas - handled in main.js game loop
        // ctx.clearRect(0, 0, this.width, this.height);


        // Render Entities
        this.player.render(ctx);
        this.playerBullets.forEach(bullet => bullet.render(ctx));
        this.enemyBullets.forEach(bullet => bullet.render(ctx));
        this.enemies.forEach(enemy => enemy.render(ctx));
        this.powerUps.forEach(powerUp => powerUp.render(ctx));
        this.securityFiles.forEach(file => file.render(ctx));

        // Apply glitch effect if active (render AFTER drawing entities)
         if (this.glitchTimer < this.glitchDuration) { // Apply glitch only for the duration *after* timer reset
             applyGlitchEffect(ctx, this.width, this.height);
         }
         // Reset transform is handled in fx.js or main.js if global transform is used
    }

    handleShoot() {
        // Check if game is running and player is not on cooldown
        if (this.gameOver || this.gameWin || this.player.isShooting) return;

        // Shoot logic based on player state (triple shot or single)
        if (this.player.tripleShotActive) {
            this.playerBullets.push(new Bullet(this, this.player.x + this.player.width / 2, this.player.y, -1, 0)); // Middle bullet
            // Adjust offsets based on player width and desired spread
            const offset = this.player.width / 4; // Example offset
            this.playerBullets.push(new Bullet(this, this.player.x + this.player.width / 2 - offset, this.player.y + 5, -1)); // Left bullet
            this.playerBullets.push(new Bullet(this, this.player.x + this.player.width / 2 + offset, this.player.y + 5, -1)); // Right bullet
        } else {
            this.playerBullets.push(new Bullet(this, this.player.x + this.player.width / 2, this.player.y, -1));
        }

        // Play shoot sound
        this.audioManager.playSound('shoot');
        // Start player's shooting cooldown
        this.player.startShootingCooldown();
    }

    spawnWave() {
         // Ensure enemies don't spawn if player has already won
         if (this.gameWin) return;

         // Keep number of enemies per wave constant
         const numEnemies = this.enemiesPerWave; // Use the base value directly
        for (let i = 0; i < numEnemies; i++) {
            const x = Math.random() * (this.width - 50); // Random x position
            const y = -50 - i * 50; // Stack enemies above the screen (slightly less vertical separation)
            // Difficulty (speed etc.) is set within the Enemy constructor with constant values now
            this.enemies.push(new Enemy(this, x, y));
        }
         //console.log(`Wave ${this.waveCount + 1} spawned with ${numEnemies} enemies.`); // Keep logging if useful
         this.waveCount++; // Increment wave count after spawning
         // Music tempo is now updated when files are collected, not on wave spawn
    }

    spawnSecurityFile() {
         // Only spawn if not already reached win condition and max files on screen not reached
         if (this.securityFiles.length < this.maxFilesOnScreen && this.filesCollected < this.filesToWin) {
            const x = Math.random() * (this.width - 30); // Random x position
            // Spawn files higher up, they will move down now
            const y = Math.random() * (this.height * 0.2); // Random y position in upper screen
            this.securityFiles.push(new SecurityFile(this, x, y));
             console.log('Security file spawned');
         }
    }


     // Reverting handleCollisions to filter at the end for simplicity
      handleCollisions() {
         // --- Player Bullets vs Enemies ---
         // Use new arrays to collect entities to be marked for deletion to avoid modifying array while iterating
         const enemiesHitByPlayerBullets = [];
         const playerBulletsHit = [];

         this.playerBullets.forEach(bullet => {
             this.enemies.forEach(enemy => {
                 if (this.checkCollision(bullet, enemy)) {
                     // Collision!
                     enemy.hit(1); // Reduce enemy health
                     playerBulletsHit.push(bullet); // Mark bullet for removal
                     this.audioManager.playSound('enemyHit');
                     if (enemy.health <= 0) {
                         enemiesHitByPlayerBullets.push(enemy); // Mark enemy for removal
                         this.score += enemy.scoreValue; // Add score

                          // Random Power-up Drop
                          if (Math.random() < this.powerUpDropChance) {
                              this.dropPowerUp(enemy.x + enemy.width / 2 - 10, enemy.y + enemy.height / 2 - 10); // Drop powerup centered on enemy
                          }
                     }
                 }
             });
         });

         // Mark collected entities for deletion
         playerBulletsHit.forEach(bullet => bullet.markedForDeletion = true);
         enemiesHitByPlayerBullets.forEach(enemy => enemy.markedForDeletion = true);


         // --- Bomb Power-up effect ---
          if (this.player.bombActive) {
              let scoreFromBomb = 0;
              const enemiesToClear = [...this.enemies]; // Snapshot current enemies
              enemiesToClear.forEach(enemy => {
                   // Only mark if not already marked by a bullet collision in the same frame
                   if (!enemy.markedForDeletion) {
                       enemy.markedForDeletion = true; // Mark for deletion
                       scoreFromBomb += enemy.scoreValue; // Add score
                   }
              });
              this.score += scoreFromBomb; // Add accumulated score from bomb
              // Clear enemy bullets too
              this.enemyBullets.forEach(bullet => bullet.markedForDeletion = true);
              this.player.bombActive = false; // Deactivate bomb after use
              this.audioManager.playSound('bomb'); // Play bomb sound
          }

          // --- Freeze Power-up effect ---
         if (this.player.freezeActive) {
             this.enemies.forEach(enemy => {
                 enemy.freeze();
             });
              // Freeze enemy bullets too
              this.enemyBullets.forEach(bullet => bullet.freeze()); // Assuming bullets have a freeze method
             this.player.freezeActive = false; // Deactivate freeze after use
         }


         // --- Enemy Bullets vs Player ---
          const enemyBulletsHitPlayer = [];
         this.enemyBullets.forEach(bullet => {
             if (this.checkCollision(bullet, this.player)) {
                 if (!this.player.isShielded) {
                     this.player.hit(1); // Reduce player lives
                     this.audioManager.playSound('playerHit');
                 } else {
                      this.audioManager.playSound('glitch'); // Shield block sound
                 }
                 enemyBulletsHitPlayer.push(bullet); // Mark bullet for removal
             }
         });
         enemyBulletsHitPlayer.forEach(bullet => bullet.markedForDeletion = true);


         // --- Player vs Enemies (Collision could also damage player) ---
          const enemiesHitPlayer = [];
         this.enemies.forEach(enemy => {
             if (this.checkCollision(enemy, this.player)) {
                 // Damage player only if not already marked for deletion from bullet collision
                 if (!enemy.markedForDeletion) {
                      if (!this.player.isShielded) {
                         this.player.hit(1); // Reduce player lives
                         this.audioManager.playSound('playerHit');
                      } else {
                          this.audioManager.playSound('glitch'); // Shield block sound
                      }
                      enemiesHitPlayer.push(enemy); // Mark enemy for removal
                      this.score += enemy.scoreValue; // Add score for destroyed enemy
                 }
             }
         });
          enemiesHitPlayer.forEach(enemy => enemy.markedForDeletion = true);


         // --- Player vs Power-ups ---
          const powerUpsCollected = [];
          this.powerUps.forEach(powerUp => {
             if (this.checkCollision(powerUp, this.player)) {
                 powerUp.applyEffect(this.player); // Apply power-up effect
                 powerUpsCollected.push(powerUp);
                 // Sound is played inside PowerUp activate methods now
             }
         });
         powerUpsCollected.forEach(powerUp => powerUp.markedForDeletion = true);


          // --- Player vs Security Files ---
           const filesCollected = [];
          this.securityFiles.forEach(file => {
              if (this.checkCollision(file, this.player)) {
                  filesCollected.push(file);
                  this.filesCollected++;
                  this.audioManager.playSound('filePickup');
                  // Update music tempo based on files collected - Keep this escalating effect
                  // Max tempo is 1.0 + 3 * 0.05 = 1.15
                  const tempo = 1.0 + this.filesCollected * 0.05;
                  this.audioManager.setMusicTempo(tempo);
              }
          });
           filesCollected.forEach(file => file.markedForDeletion = true);


         // Filter arrays AFTER all collision checks based on markedForDeletion flag
         this.playerBullets = this.playerBullets.filter(bullet => !bullet.markedForDeletion);
         this.enemyBullets = this.enemyBullets.filter(bullet => !bullet.markedForDeletion);
         this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);
         this.powerUps = this.powerUps.filter(powerUp => !powerUp.markedForDeletion);
         this.securityFiles = this.securityFiles.filter(file => !file.markedForDeletion);
     }


    dropPowerUp(x, y) {
        // Randomly select a power-up type
        const types = ['shield', 'tripleShot', 'bomb', 'speedBoost', 'freeze'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        this.powerUps.push(new PowerUp(this, x, y, randomType));
    }


    checkCollision(rect1, rect2) {
        // Basic AABB collision detection
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect2.height > rect2.y
        );
    }
}