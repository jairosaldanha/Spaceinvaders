// audioManager.js
export default class AudioManager {
    constructor() {
        try {
            // Create AudioContext only after a user gesture
            // Initialize it, but it will likely be in 'suspended' state
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            this.buffers = {}; // Stores loaded audio buffers
            // Connect gain node to output - Use this for master volume/mute
            this.masterGainNode = this.audioContext.createGain();
            this.masterGainNode.connect(this.audioContext.destination);


            this.musicSource = null; // To hold the current music AudioBufferSourceNode
            // Optional: separate gain for music vs sfx if needed for mixing. For mute, masterGainNode is sufficient.
            // this.musicGain = this.audioContext.createGain();
            // this.musicGain.connect(this.masterGainNode);

            this.musicBasePlaybackRate = 1.0; // Base tempo
            this.currentMusicName = null; // Track the name of the currently playing music

            this.isMuted = false; // State for manual mute button
            this.wasMutedBeforePause = false; // State for auto-pause on tab switch

            this.muteButton = null; // Reference to the mute button element
        } catch (e) {
            console.error('Web Audio API is not supported in this browser:', e);
            this.audioContext = null; // Disable audio if not supported
        }
    }

    // Add a reset method to restore initial state for a new game
     reset() {
         this.musicBasePlaybackRate = 1.0; // Reset music tempo
         // Don't reset mute state or other global states like buffers/context
     }

    setMuteButton(buttonElement) {
         this.muteButton = buttonElement;
         this.updateMuteButtonText(); // Set initial text
    }

    updateMuteButtonText() {
        if (this.muteButton) {
            this.muteButton.textContent = this.isMuted ? 'UNMUTE' : 'MUTE';
        }
    }

    toggleMute() {
        if (!this.audioContext) return;

        this.isMuted = !this.isMuted;
        this.updateMuteButtonText();

        if (this.isMuted) {
            // Mute: Set gain to 0 and stop music
            this.masterGainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            this.stopMusic(); // stopMusic sets currentMusicName to null
        } else {
            // Unmute: Set gain back to 1 and resume music if it was playing before muting
            this.masterGainNode.gain.setValueAtTime(1, this.audioContext.currentTime);
             // If currentMusicName is set, play it again (playMusic handles stopping any existing source)
             // Note: currentMusicName is cleared by stopMusic(). We need to remember which music was playing.
             // Let's store the name before stopping.
             const musicToResume = this._lastPlayedMusicName; // Use a temp variable

            // Need to store which music was playing *before* stopping on mute
            // Let's modify playMusic and stopMusic slightly or add a state variable.
            // Simpler: The music loop is restarted anyway on game start.
            // When unmuting, just ensure gain is 1. If the music is playing via the game loop, it will be heard.
            // If music was paused due to tab switch while *not* muted, it will resume via resumeAllAudio.
            // The game start calls playMusic('music'), which is the primary way music starts.
            // So, unmuting just needs to restore the gain.
             if (this.currentMusicName) { // If music was the LAST thing explicitly told to play...
                  // Re-play the music. The playMusic function handles stopping the old source.
                  // This ensures the music is synced correctly.
                 this.playMusic(this.currentMusicName);
             } else {
                 // If currentMusicName was null (e.g. music hadn't started or was stopped manually before mute), do nothing.
             }

        }
    }

    async loadSounds(soundList) {
        if (!this.audioContext) return;

        const promises = soundList.map(sound => this.loadSound(sound.name, sound.src));
        await Promise.all(promises);
        console.log('All sounds loaded.');
    }

    async loadSound(name, url) {
        if (!this.audioContext) return;

        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.buffers[name] = audioBuffer;
            // console.log(`Sound loaded: ${name}`); // Too verbose during load
        } catch (error) {
            console.error(`Error loading sound ${name} from ${url}:`, error);
        }
    }

    playSound(name, loop = false) {
        // Ensure context is running before playing
         this.resumeContext();

        if (!this.audioContext || !this.buffers[name]) {
            console.warn(`Sound buffer not found: ${name}`);
            return null;
        }

        // Sound effects don't play if manually muted (masterGainNode handles this)
        // or if context is suspended (handled by resumeContext check and suspend/resume logic)


        const source = this.audioContext.createBufferSource();
        source.buffer = this.buffers[name];
        source.connect(this.masterGainNode); // Connect directly to master gain
        source.loop = loop;

        try {
            source.start(0); // Play immediately
        } catch (e) {
            console.warn(`Failed to start audio source for ${name}:`, e);
             // This warning is less likely now that resumeContext is called first
        }

        return source; // Return the source node in case we need to stop it
    }

    playMusic(name, loop = true) {
         // Ensure context is running before playing
         this.resumeContext();

        if (!this.audioContext || !this.buffers[name]) {
            console.warn(`Music buffer not found: ${name}`);
            this.currentMusicName = null; // Ensure name is null if buffer isn't found
            return;
        }

        // Stop previous music if playing
        if (this.musicSource) {
            try {
                 this.musicSource.stop();
            } catch (e) {
                 console.warn('Failed to stop previous music source:', e);
            } finally {
                 this.musicSource.disconnect();
                 this.musicSource = null;
            }
        }

        // Only start music if not currently manually muted
        if (this.isMuted) {
            // If muted, just update the name, don't start the source yet
            this.currentMusicName = name;
            // Music will be started when unmute happens
            return;
        }

        this.musicSource = this.audioContext.createBufferSource();
        this.musicSource.buffer = this.buffers[name];
        // Connect music source directly to master gain node
        this.musicSource.connect(this.masterGainNode);
        this.musicSource.loop = loop;
         // Set playback rate using the current base rate
         this.musicSource.playbackRate.setValueAtTime(this.musicBasePlaybackRate, this.audioContext.currentTime);

        try {
            this.musicSource.start(0); // Play immediately
            this.currentMusicName = name; // Track which music is playing
        } catch (e) {
            console.warn(`Failed to start music source for ${name}:`, e);
             this.currentMusicName = null; // Clear name if failed to start
        }
    }

    stopMusic() {
        if (this.musicSource) {
            try {
                 this.musicSource.stop();
            } catch (e) {
                 console.warn('Failed to stop music source:', e);
            } finally {
                 this.musicSource.disconnect();
                 this.musicSource = null;
                 this.currentMusicName = null; // No music is currently playing
            }
        } else {
             this.currentMusicName = null; // Ensure name is null if source was already null
        }
    }

    setVolume(volume) {
        // Note: This might interfere with the mute logic.
        // If we want volume control *in addition* to mute, we should have
        // a separate gain node for user volume control before the master gain.
        // For now, this directly controls the master gain, effectively overriding mute/unmute gain.
        // Let's remove this method or adjust its implementation.
        // The requirement is just mute/unmute. Let's remove setVolume for now.
         console.warn("setVolume method is not actively used or recommended with current mute logic. Use toggleMute instead.");
        // if (this.masterGainNode && this.audioContext) {
        //     this.masterGainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        // }
    }

     setMusicTempo(rate) {
         // Ensure playback rate is positive and within a reasonable range
         const newRate = Math.max(0.1, Math.min(rate, 2.0)); // Limit max tempo increase

         if (this.musicSource && this.audioContext) {
             this.musicSource.playbackRate.setValueAtTime(newRate, this.audioContext.currentTime);
         }
         // Always store the desired rate, even if the source doesn't exist yet
         this.musicBasePlaybackRate = newRate;
     }

    // Ensure context is running (necessary for some browsers after user gesture)
    resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
             console.log('Attempting to resume AudioContext...');
            this.audioContext.resume().then(() => {
                 console.log('AudioContext resumed successfully');
            }).catch(e => {
                 console.error('Failed to resume AudioContext:', e);
            });
        }
    }

     // Pause audio when tab is inactive
     pauseAllAudio() {
         if (!this.audioContext) return;

         // Store the current mute state
         this.wasMutedBeforePause = this.isMuted;

         // If not manually muted, suspend the context
         if (this.audioContext.state === 'running' && !this.isMuted) {
              console.log('Suspending AudioContext due to tab inactivity...');
             this.audioContext.suspend().then(() => {
                  console.log('AudioContext suspended successfully');
             }).catch(e => {
                  console.error('Failed to suspend AudioContext:', e);
             });
         }
          // If already manually muted, no need to suspend the context, gain is already 0.
     }

     // Resume audio when tab is active again
     resumeAllAudio() {
         if (!this.audioContext) return;

         // If context is suspended AND it was NOT manually muted before pausing
         if (this.audioContext.state === 'suspended' && !this.wasMutedBeforePause) {
              console.log('Resuming AudioContext due to tab activity...');
             this.audioContext.resume().then(() => {
                  console.log('AudioContext resumed successfully');
             }).catch(e => {
                  console.error('Failed to resume AudioContext:', e);
             });
         }
         // Reset the flag
         this.wasMutedBeforePause = false;

          // If currently not muted manually (isMuted == false),
          // and music was playing before the tab pause (currentMusicName is not null)
          // ensure music is playing. resumeContext above handles SFX if any were pending.
          // playMusic needs to handle restarting the source if the context was suspended.
          // The existing playMusic method stops and starts the source, which works fine if context is running.
          // If context was suspended, resumeContext *should* make start(0) work correctly.
          // Let's ensure music restarts if needed *after* context is resumed.
          // The playMusic call in startGame handles starting music when the game begins/restarts.
          // For mid-game tab-switch resume, the resumeContext handles un-suspending, and the music source might continue automatically
          // IF it wasn't explicitly stopped by `pauseAllAudio` (which it wasn't).
          // Let's ensure the tempo is correct on resume in case it drifted or was reset somewhere else.
           if (!this.isMuted && this.musicSource) {
                // If music is playing and not muted, ensure tempo is the desired base rate
                this.setMusicTempo(this.musicBasePlaybackRate);
           } else if (!this.isMuted && this.currentMusicName && !this.musicSource) {
               // Edge case: Music name is set, but source is null (e.g. stopped manually or failed to start).
               // In this case, resuming context won't auto-start it. The game start logic handles re-playing.
               // No need to force a restart here unless the game state requires it.
           }

     }

}

// Note: A global click listener is added in main.js to call resumeContext on first interaction.
// This is the standard way to handle browser autoplay policies for Web Audio API.