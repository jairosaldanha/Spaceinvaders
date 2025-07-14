import Game from "./game.js";
import InputHandler from "./inputHandler.js";
import AudioManager from "./audioManager.js";

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const uiOverlay = document.getElementById('ui-overlay');
const scoreElement = document.getElementById('score');
const filesCollectedElement = document.getElementById('files-collected');
const messageElement = document.getElementById('message');
const mobileControls = document.getElementById('mobile-controls');
const shootButton = document.getElementById('shoot-button');
const leftButton = document.getElementById('left-button'); // Get left button
const rightButton = document.getElementById('right-button'); // Get right button
const muteButton = document.getElementById('mute-button'); // Get mute button


const ASPECT_RATIO = 16 / 9; // Example aspect ratio, adjust as needed for look
let game;
let inputHandler;
let audioManager; // Declare audioManager globally

// Variable to hold the ID returned by requestAnimationFrame
let animationFrameId = null;

// Function to resize canvas
function resizeCanvas() {
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Detect mobile layout
    const isMobileLayout = window.innerWidth <= 768;
    // Show or hide mobile controls first so we can measure their height
    if (isMobileLayout) {
        mobileControls.classList.remove('hidden');
    } else {
        mobileControls.classList.add('hidden');
    }

    // Reserve space for mobile controls if visible
    const mobileControlsHeight = isMobileLayout ? mobileControls.getBoundingClientRect().height : 0;
    const availableWidth = containerWidth;
    const availableHeight = containerHeight - mobileControlsHeight;

    // Choose aspect ratio: portrait on mobile, landscape on desktop
    const DESKTOP_ASPECT_RATIO = 16 / 9;
    const MOBILE_ASPECT_RATIO = 9 / 16;
    const aspectRatio = isMobileLayout ? MOBILE_ASPECT_RATIO : DESKTOP_ASPECT_RATIO;

    let canvasWidth, canvasHeight;
    if (availableWidth / availableHeight > aspectRatio) {
        // Height is limiting factor
        canvasHeight = availableHeight;
        canvasWidth = canvasHeight * aspectRatio;
    } else {
        // Width is limiting factor
        canvasWidth = availableWidth;
        canvasHeight = canvasWidth / aspectRatio;
    }

    // Enforce minimum dimensions
    const minWidth = 320;
    const minHeight = minWidth / aspectRatio;
    canvasWidth = Math.max(canvasWidth, minWidth);
    canvasHeight = Math.max(canvasHeight, minHeight);

    // Desktop maximum constraints
    if (!isMobileLayout) {
        const maxWidth = Math.min(1200, window.innerWidth * 0.9);
        const maxHeight = Math.min(800, window.innerHeight * 0.9);
        if (canvasWidth > maxWidth) {
            canvasWidth = maxWidth;
            canvasHeight = canvasWidth / aspectRatio;
        }
        if (canvasHeight > maxHeight) {
            canvasHeight = maxHeight;
            canvasWidth = canvasHeight * aspectRatio;
        }
    }

    // Apply to canvas
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Notify game of size change
    if (game) {
        game.resize(canvas.width, canvas.height);
    }
}


// Initial resize and setup
resizeCanvas(); // Call resize once initially
window.addEventListener('resize', resizeCanvas); // Listen for window resize


// Function to handle game start/restart
function startGame() {
    // Cancel any pending animation frame from a previous game loop instance
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    messageElement.classList.add('hidden');
    messageElement.removeEventListener('click', startGame); // Remove listener after starting

    // Initialize or re-initialize audio manager
    if (!audioManager) {
         audioManager = new AudioManager();
         // Pass the mute button to the audio manager
         audioManager.setMuteButton(muteButton);

         // Resume audio context on the first user gesture (game start click)
         // This is also handled by the body click listener below, but good to have here too.
         audioManager.resumeContext();


        audioManager.loadSounds([
            { name: 'shoot', src: 'shoot.mp3' },
            { name: 'enemyHit', src: 'enemyHit.mp3' },
            { name: 'playerHit', src: 'playerHit.mp3' },
            { name: 'powerup', src: 'powerup.mp3' },
            { name: 'filePickup', src: 'filePickup.mp3' },
            { name: 'bomb', src: 'bomb.mp3' },
            { name: 'glitch', src: 'glitch.mp3' },
            { name: 'gameOver', src: 'gameOver.mp3' },
            { name: 'win', src: 'win.mp3' },
            { name: 'music', src: 'music.mp3' } // Background music
        ]).then(() => {
             // Ensure tempo is reset before playing music for a new game
             if (audioManager) audioManager.reset();
             audioManager.playMusic('music');
        }).catch(error => {
            console.error("Failed to load audio:", error);
        });

         // Add event listener for the mute button
         // Ensure this listener is only added once
         if (!muteButton._listenerAdded) {
             muteButton.addEventListener('click', () => {
                 if (audioManager) audioManager.toggleMute();
             });
              muteButton._listenerAdded = true; // Mark listener as added
         }


         // Add visibility/blur listeners for auto-pause/resume
         // Ensure these listeners are only added once
          if (!document._visibilityListenerAdded) {
             document.addEventListener('visibilitychange', handleVisibilityChange);
              document._visibilityListenerAdded = true;
          }
          if (!window._blurListenerAdded) {
             window.addEventListener('blur', handleBlur);
             window._blurListenerAdded = true;
          }
          if (!window._focusListenerAdded) {
             window.addEventListener('focus', handleFocus);
             window._focusListenerAdded = true;
          }

    } else {
        // If audioManager already exists (subsequent game start), just resume context and play music
        audioManager.resumeContext();
         // Ensure tempo is reset before playing music for a new game
         audioManager.reset();
        audioManager.playMusic('music'); // This will stop the old music and start a new one
         // Ensure mute state is reset or carried over correctly? Reset seems safer for a new game.
         // Let's not reset mute state on game restart, keep it as the user left it.
         // If muted, playMusic won't make sound due to gainNode.gain=0, which is correct.
    }


    // Initialize input handler - pass new buttons
    // Create a new input handler instance for a fresh start
    // Call destroy on the old one first to clean up listeners
    if (inputHandler) {
         inputHandler.destroy();
    }
    inputHandler = new InputHandler(canvas, shootButton, leftButton, rightButton);


    // Initialize game - Create a NEW game instance every time
    // Pass the latest inputHandler and audioManager instances
    // This new instance starts with fresh timers, scores, and entity arrays
    game = new Game(canvas.width, canvas.height, inputHandler, audioManager);
    game.uiElements = {
        score: scoreElement,
        filesCollected: filesCollectedElement,
        message: messageElement,
        // No need to pass button elements to Game anymore, handled in main/inputHandler/audioManager
    };

     // Add click listener for shooting (desktop mouse or mobile shoot button touch)
     // This is added to the *inputHandler* instance, which is consistent
     // Ensure this listener is only added once per inputHandler instance
     inputHandler.addClickListener(() => {
         // Ensure audio context is resumed before playing sound on first interaction
         if (audioManager) audioManager.resumeContext();
         if (game && !game.gameOver && !game.gameWin) { // Only shoot if game is active
             game.handleShoot(); // Trigger shoot from game logic
         }
     });


    // Start the game loop
    let lastTime = 0;
    function gameLoop(timestamp) {
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!game.gameOver && !game.gameWin) {
            game.update(deltaTime);
            game.render(ctx);
             // Update UI elements directly from game state
            scoreElement.textContent = `SCORE: ${game.score}`;
            filesCollectedElement.textContent = `FILES: ${game.filesCollected}/${game.filesToWin}`;
            // Request the next frame
            animationFrameId = requestAnimationFrame(gameLoop);
        } else {
             // Game over or win state
            game.render(ctx); // Render final state
            // Ensure UI is correct in game over state
            scoreElement.textContent = `SCORE: ${game.score}`;
            filesCollectedElement.textContent = `FILES: ${game.filesCollected}/${game.filesToWin}`;

            messageElement.classList.remove('hidden');
            if (game.gameWin) {
                // Display final message with Continue button
                messageElement.innerHTML = '<div>System successfully restored.</div><button id="continue-button">Continue</button>';
                if (audioManager) audioManager.stopMusic();
                if (game && !game._winSoundPlayed) {
                    audioManager.playSound('win');
                    game._winSoundPlayed = true;
                }
                // Redirect to external URL on click
                const continueBtn = document.getElementById('continue-button');
                continueBtn.addEventListener('click', () => {
                    window.location.href = 'https://www.youtube.com/';
                });
            } else {
                // Game Over state: allow restart
                messageElement.innerHTML = 'SYSTEM CORRUPTED<br>GAME OVER<br>CLICK TO RESTART';
                if (audioManager) audioManager.stopMusic();
                if (game && !game._gameOverSoundPlayed) {
                    audioManager.playSound('gameOver');
                    game._gameOverSoundPlayed = true;
                }
                // Restart game on click
                messageElement.removeEventListener('click', startGame);
                messageElement.addEventListener('click', startGame);
            }
             // Do NOT request next frame, the loop stops here
        }
    }

    gameLoop(0); // Start the loop for the new game instance
}

// Handle tab visibility change for audio auto-pause/resume
function handleVisibilityChange() {
    if (document.hidden) {
        // Tab is hidden, pause audio
        if (audioManager) {
            audioManager.pauseAllAudio();
        }
    } else {
        // Tab is visible, resume audio
         if (audioManager) {
            audioManager.resumeAllAudio();
        }
    }
}

// Handle window blur (losing focus)
function handleBlur() {
     if (audioManager) {
        audioManager.pauseAllAudio();
    }
}

// Handle window focus
function handleFocus() {
     if (audioManager) {
        audioManager.resumeAllAudio();
    }
}


// Show initial message to start the game
messageElement.classList.remove('hidden');
messageElement.innerHTML = 'HACKED SYSTEM DEFENSE<br>CLICK TO START';
messageElement.addEventListener('click', startGame);

// Optional: Resume audio context on any touch/click interaction on the body before game starts
// This helps ensure audio works even if the user clicks outside the start message first.
// This listener now only attempts to resume if audioManager is initialized but suspended.
// Ensure this listener is only added once
if (!document.body._firstClickListenerAdded) {
     document.body.addEventListener('click', () => {
         if (audioManager && audioManager.audioContext && audioManager.audioContext.state === 'suspended') {
              console.log('Attempting to resume AudioContext from body click...');
             audioManager.audioContext.resume().then(() => {
                  console.log('AudioContext resumed from body click.');
             }).catch(e => {
                  console.error('Failed to resume AudioContext from body click:', e);
             });
         }
     }, { once: true }); // Use { once: true } to remove listener after first trigger
     document.body._firstClickListenerAdded = true;
}