class Metronome {
    constructor() {
        this.tempo = 120;
        this.isPlaying = false;
        this.wasPlayingBeforeSlider = false;
        this.interval = null;
        this.beatCount = 0;
        this.timeSignature = '4/4';
        this.beatsPerMeasure = 4;
        
        // Audio context for metronome sounds
        this.audioContext = null;
        this.highTone = null;
        this.lowTone = null;
        
        this.initializeAudio();
        this.initializeElements();
        this.bindEvents();
        this.updateDisplay();
    }
    
    initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.createTones();
        } catch (error) {
            console.log('Audio not supported, visual only mode');
        }
    }
    
    createTones() {
        // Create high tone (first beat)
        this.highTone = this.createTone(800, 0.1);
        // Create low tone (other beats)
        this.lowTone = this.createTone(600, 0.08);
    }
    
    createTone(frequency, duration) {
        return () => {
            if (!this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        };
    }
    
    initializeElements() {
        this.tempoDisplay = document.getElementById('tempo');
        this.tempoSlider = document.getElementById('tempo-slider');
        this.startImgBtn = document.getElementById('start-img-btn');
    }
    
    bindEvents() {
        this.startImgBtn.addEventListener('click', () => this.togglePlayPause());
        this.tempoSlider.addEventListener('input', (e) => this.setTempo(parseInt(e.target.value)));

        // Mute while moving the slider
        this.tempoSlider.addEventListener('mousedown', () => this.handleSliderStart());
        this.tempoSlider.addEventListener('touchstart', () => this.handleSliderStart());
        document.addEventListener('mouseup', () => this.handleSliderEnd());
        document.addEventListener('touchend', () => this.handleSliderEnd());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.togglePlayPause();
            } else if (e.code === 'ArrowLeft') {
                this.adjustTempo(-1);
            } else if (e.code === 'ArrowRight') {
                this.adjustTempo(1);
            }
        });
        
        // Touch/swipe gestures for tempo adjustment
        let startX = 0;
        let startY = 0;
        
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;
            
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            
            // Only handle horizontal swipes
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                if (deltaX > 0) {
                    this.adjustTempo(1);
                } else {
                    this.adjustTempo(-1);
                }
            }
            
            startX = 0;
            startY = 0;
        });
    }
    
    setTempo(tempo) {
        this.tempo = Math.max(40, Math.min(208, tempo));
        this.tempoSlider.value = this.tempo;
        this.updateDisplay();
        
        if (this.isPlaying) {
            this.stop();
            this.start();
        }
    }
    
    adjustTempo(delta) {
        this.setTempo(this.tempo + delta);
    }
    
    togglePlayPause() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.start();
        }
    }
    
    start() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.beatCount = 0;
        this.startImgBtn.classList.add('playing');
        
        const intervalMs = (60 / this.tempo) * 1000;
        this.interval = setInterval(() => {
            this.playBeat();
        }, intervalMs);
        
        // Play first beat immediately
        this.playBeat();
    }
    
    stop() {
        this.isPlaying = false;
        this.startImgBtn.classList.remove('playing');
        
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
    
    playBeat() {
        // Audio feedback
        if (this.beatCount % this.beatsPerMeasure === 0) {
            // First beat of measure
            if (this.highTone) this.highTone();
        } else {
            // Other beats
            if (this.lowTone) this.lowTone();
        }
        
        this.beatCount++;
    }
    
    updateDisplay() {
        this.tempoDisplay.textContent = this.tempo;
    }

    handleSliderStart() {
        this.wasPlayingBeforeSlider = this.isPlaying;
        if (this.isPlaying) {
            this.stop();
        }
    }

    handleSliderEnd() {
        if (this.wasPlayingBeforeSlider) {
            this.start();
        }
        this.wasPlayingBeforeSlider = false;
    }
}

// Initialize metronome when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.metronome = new Metronome();
});

// Handle audio context activation on user interaction
document.addEventListener('click', () => {
    if (window.metronome && window.metronome.audioContext && window.metronome.audioContext.state === 'suspended') {
        window.metronome.audioContext.resume();
    }
}, { once: true }); 