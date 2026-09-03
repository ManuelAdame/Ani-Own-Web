const MusicPlayer = {
    audioPlayer: null,
    songTitle: null,
    songStatus: null,
    volumeSlider: null,
    playPauseBtn: null,
    playerElement: null,
    playlist: [],
    currentIndex: 0,
    isPlaying: false,

    init() {
        this.audioPlayer = document.getElementById('audioPlayer');
        this.songTitle = document.getElementById('songTitle');
        this.songStatus = document.getElementById('songStatus');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.playerElement = document.querySelector('.music-player');

        this.loadState();
        this.setupEventListeners();
        this.loadPlaylist();
    },

    loadState() {
        // Cargar estado minimizado
        const isMinimized = localStorage.getItem('musicPlayerMinimized') === 'true';
        if (isMinimized) {
            this.playerElement.classList.add('minimized');
        }

        // Cargar volumen
        const savedVolume = localStorage.getItem('musicPlayerVolume');
        if (savedVolume) {
            this.volumeSlider.value = savedVolume;
            this.audioPlayer.volume = savedVolume / 100;
        } else {
            this.audioPlayer.volume = 0.5;
        }
    },

    saveState() {
        localStorage.setItem('musicPlayerIndex', this.currentIndex);
        localStorage.setItem('musicPlayerTime', this.audioPlayer.currentTime);
        localStorage.setItem('musicPlayerVolume', this.volumeSlider.value);
        localStorage.setItem('musicPlayerPlaying', this.isPlaying);
    },

    setupEventListeners() {
        // Control de volumen
        this.volumeSlider.addEventListener('input', (e) => {
            this.audioPlayer.volume = e.target.value / 100;
            localStorage.setItem('musicPlayerVolume', e.target.value);
        });

        // Actualizar el estado de tiempo
        this.audioPlayer.addEventListener('timeupdate', () => {
            this.updateStatus();
            // Guardar estado cada segundo
            if (Math.floor(this.audioPlayer.currentTime) % 1 === 0) {
                this.saveState();
            }
        });

        // Cuando termina una canción, pasar a la siguiente
        this.audioPlayer.addEventListener('ended', () => this.nextSong());

        // Cuando la metadata está cargada
        this.audioPlayer.addEventListener('loadedmetadata', () => this.updateStatus());

        // Play/Pause
        this.audioPlayer.addEventListener('play', () => {
            this.isPlaying = true;
            this.playPauseBtn.textContent = '⏸️';
            localStorage.setItem('musicPlayerPlaying', 'true');
        });

        this.audioPlayer.addEventListener('pause', () => {
            this.isPlaying = false;
            this.playPauseBtn.textContent = '▶️';
            localStorage.setItem('musicPlayerPlaying', 'false');
        });

        // Click en cualquier parte para iniciar si está bloqueado
        let autoplayAttempted = false;
        document.addEventListener('click', () => {
            if (!autoplayAttempted && this.audioPlayer.paused && this.playlist.length > 0) {
                this.audioPlayer.play().catch(() => {});
                autoplayAttempted = true;
            }
        });

        // Guardar estado antes de salir
        window.addEventListener('beforeunload', () => {
            this.saveState();
        });
    },

    loadPlaylist() {
        fetch('/api/playlist')
            .then(response => response.json())
            .then(data => {
                this.playlist = data.songs;
                if (this.playlist.length > 0) {
                    // Intentar restaurar estado anterior
                    const savedIndex = localStorage.getItem('musicPlayerIndex');
                    const savedTime = localStorage.getItem('musicPlayerTime');
                    const wasPlaying = localStorage.getItem('musicPlayerPlaying') === 'true';

                    if (savedIndex !== null && savedIndex < this.playlist.length) {
                        this.loadSong(parseInt(savedIndex));
                        
                        // Restaurar tiempo de reproducción
                        if (savedTime) {
                            this.audioPlayer.addEventListener('loadedmetadata', () => {
                                this.audioPlayer.currentTime = parseFloat(savedTime);
                            }, { once: true });
                        }

                        // Restaurar reproducción si estaba sonando
                        if (wasPlaying) {
                            setTimeout(() => {
                                this.audioPlayer.play().catch(err => {
                                    console.log('Autoplay bloqueado');
                                    this.songStatus.textContent = 'Click para reproducir';
                                });
                            }, 500);
                        }
                    } else {
                        // Primera vez, cargar primera canción
                        this.loadSong(0);
                        setTimeout(() => {
                            this.audioPlayer.play().catch(err => {
                                console.log('Autoplay bloqueado');
                                this.songStatus.textContent = 'Click para reproducir';
                            });
                        }, 500);
                    }
                }
            });
    },

    loadSong(index) {
        this.currentIndex = index;
        const songName = this.playlist[index];
        this.audioPlayer.src = `/static/music/${encodeURIComponent(songName)}`;
        this.songTitle.textContent = songName.replace('.mp3', '');
        this.updateStatus();
    },

    updateStatus() {
        const current = this.formatTime(this.audioPlayer.currentTime);
        const duration = this.formatTime(this.audioPlayer.duration);
        this.songStatus.textContent = `${current} / ${duration}`;
    },

    formatTime(seconds) {
        if (isNaN(seconds)) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    togglePlayPause() {
        if (this.audioPlayer.paused) {
            this.audioPlayer.play();
        } else {
            this.audioPlayer.pause();
        }
    },

    nextSong() {
        this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
        this.loadSong(this.currentIndex);
        this.audioPlayer.play();
        this.saveState();
    },

    previousSong() {
        this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
        this.loadSong(this.currentIndex);
        this.audioPlayer.play();
        this.saveState();
    },

    minimize() {
        this.playerElement.classList.add('minimized');
        localStorage.setItem('musicPlayerMinimized', 'true');
    },

    maximize() {
        this.playerElement.classList.remove('minimized');
        localStorage.setItem('musicPlayerMinimized', 'false');
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    MusicPlayer.init();
});
