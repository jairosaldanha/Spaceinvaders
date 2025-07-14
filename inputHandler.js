// inputHandler.js
export default class InputHandler {
    constructor(canvas, shootButton, leftButton, rightButton) { // Accept buttons as arguments
        this.keys = {}; // State for keyboard keys
        this.leftPressed = false; // State for left button/key
        this.rightPressed = false; // State for right button/key
        // Removed shootPressed as spacebar/click handles shooting differently

        this.canvas = canvas;
        this.shootButton = shootButton;
        this.leftButton = leftButton;
        this.rightButton = rightButton;

        this.clickListeners = []; // Store listeners for shoot action (mouse click or button press/spacebar)

        // Desktop Keyboard Controls (Arrow keys, WASD, Space)
        // Use bound methods or arrow functions to ensure 'this' refers to InputHandler instance
        this._keydownListener = e => {
            // Only trigger shoot on keydown to simulate a click/tap
             if (e.key === ' ' && !this.keys[e.key]) { // Check if spacebar was just pressed down
                this.keys[e.key] = true;
                 // Trigger the registered shoot click listeners
                 this.clickListeners.forEach(listener => listener());
             } else {
                this.keys[e.key] = true; // For movement keys, just set state
             }

             // Prevent default for common game keys
            if (['ArrowLeft', 'ArrowRight', ' ', 'a', 'd'].includes(e.key)) {
                 e.preventDefault();
            }
        };
        this._keyupListener = e => {
             // Crucially, reset the spacebar key state on keyup
            if (e.key === ' ') {
                 this.keys[e.key] = false;
             } else {
                this.keys[e.key] = false; // For movement keys, just set state
             }

             if (['ArrowLeft', 'ArrowRight', ' ', 'a', 'd'].includes(e.key)) {
                 e.preventDefault();
            }
        };
        // Add listeners
        window.addEventListener('keydown', this._keydownListener);
        window.addEventListener('keyup', this._keyupListener);


        // Desktop Mouse Click for Shooting (handled by canvas listener in main.js via clickListeners)
        // Use bound method
        this._canvasMousedownListener = e => {
            if (e.button === 0) { // Left click
                // Trigger the registered shoot click listeners
                 this.clickListeners.forEach(listener => listener());
                 e.preventDefault(); // Prevent default canvas interactions like text selection
            }
        };
        this.canvas.addEventListener('mousedown', this._canvasMousedownListener);


        // Mobile Touch Controls (Buttons)
        // Use bound methods or arrow functions for button listeners
        this._leftTouchstartListener = e => { e.preventDefault(); this.leftPressed = true; };
        this._leftTouchendListener = e => { e.preventDefault(); this.leftPressed = false; };
        this._leftTouchcancelListener = e => { e.preventDefault(); this.leftPressed = false; }; // Handle touch interruptions
        this._leftMousedownListener = e => { e.preventDefault(); this.leftPressed = true; };
        this._leftMouseupListener = e => { e.preventDefault(); this.leftPressed = false; };
        this._leftMouseleaveListener = e => { e.preventDefault(); this.leftPressed = false; };


        this._rightTouchstartListener = e => { e.preventDefault(); this.rightPressed = true; };
        this._rightTouchendListener = e => { e.preventDefault(); this.rightPressed = false; };
        this._rightTouchcancelListener = e => { e.preventDefault(); this.rightPressed = false; };
        this._rightMousedownListener = e => { e.preventDefault(); this.rightPressed = true; };
        this._rightMouseupListener = e => { e.preventDefault(); this.rightPressed = false; };
        this._rightMouseleaveListener = e => { e.preventDefault(); this.rightPressed = false; };


        // Shoot button triggers the same click listeners on touchstart/mousedown
        this._shootTouchstartListener = e => { e.preventDefault(); this.clickListeners.forEach(listener => listener()); };
        this._shootMousedownListener = e => { e.preventDefault(); if (e.button === 0) { this.clickListeners.forEach(listener => listener()); } };


        // Add listeners to buttons
        this.leftButton.addEventListener('touchstart', this._leftTouchstartListener);
        this.leftButton.addEventListener('touchend', this._leftTouchendListener);
        this.leftButton.addEventListener('touchcancel', this._leftTouchcancelListener);
        // Also add mouse events for buttons for hybrid devices or testing
        this.leftButton.addEventListener('mousedown', this._leftMousedownListener);
        this.leftButton.addEventListener('mouseup', this._leftMouseupListener);
        this.leftButton.addEventListener('mouseleave', this._leftMouseleaveListener);


        this.rightButton.addEventListener('touchstart', this._rightTouchstartListener);
        this.rightButton.addEventListener('touchend', this._rightTouchendListener);
        this.rightButton.addEventListener('touchcancel', this._rightTouchcancelListener);
        // Also add mouse events for buttons
        this.rightButton.addEventListener('mousedown', this._rightMousedownListener);
        this.rightButton.addEventListener('mouseup', this._rightMouseupListener);
        this.rightButton.addEventListener('mouseleave', this._rightMouseleaveListener);

        this.shootButton.addEventListener('touchstart', this._shootTouchstartListener);
        // Also add mouse events for shoot button
        this.shootButton.addEventListener('mousedown', this._shootMousedownListener);

        // Note: touchend/mouseup on shoot button are not needed for semi-auto fire
    }

    // Add a method to reset input state for new game
    resetState() {
        this.keys = {};
        this.leftPressed = false;
        this.rightPressed = false;
        // clickListeners array is cleared in main.js before adding the listener
    }

     // Add a method to clean up listeners when a new InputHandler is created or game ends (optional but good practice)
     // The bound functions stored as _*Listener properties allow removal.
     destroy() {
         window.removeEventListener('keydown', this._keydownListener);
         window.removeEventListener('keyup', this._keyupListener);
         this.canvas.removeEventListener('mousedown', this._canvasMousedownListener);

         this.leftButton.removeEventListener('touchstart', this._leftTouchstartListener);
         this.leftButton.removeEventListener('touchend', this._leftTouchendListener);
         this.leftButton.removeEventListener('touchcancel', this._leftTouchcancelListener);
         this.leftButton.removeEventListener('mousedown', this._leftMousedownListener);
         this.leftButton.removeEventListener('mouseup', this._leftMouseupListener);
         this.leftButton.removeEventListener('mouseleave', this._leftMouseleaveListener);

         this.rightButton.removeEventListener('touchstart', this._rightTouchstartListener);
         this.rightButton.removeEventListener('touchend', this._rightTouchendListener);
         this.rightButton.removeEventListener('touchcancel', this._rightTouchcancelListener);
         this.rightButton.removeEventListener('mousedown', this._rightMousedownListener);
         this.rightButton.removeEventListener('mouseup', this._rightMouseupListener);
         this.rightButton.removeEventListener('mouseleave', this._rightMouseleaveListener);

         this.shootButton.removeEventListener('touchstart', this._shootTouchstartListener);
         this.shootButton.removeEventListener('mousedown', this._shootMousedownListener);

         this.clickListeners = []; // Clear listeners
         console.log('InputHandler listeners destroyed.');
     }


    // Register a function to be called when a shoot action occurs (mouse click, button press, or spacebar keydown)
     addClickListener(listener) {
         this.clickListeners.push(listener);
     }

    // Method for the game loop to get the current combined input state
    getState() {
        let moveDirection = 0;
        // Combine keyboard (ArrowLeft/a, ArrowRight/d) and button input for movement
        if (this.keys.ArrowLeft || this.keys.a || this.leftPressed) {
            moveDirection = -1;
        } else if (this.keys.ArrowRight || this.keys.d || this.rightPressed) {
            moveDirection = 1;
        }

        return {
            moveDirection: moveDirection,
            // Shoot trigger is handled by the clickListeners mechanism now, not a state flag
        };
    }
}