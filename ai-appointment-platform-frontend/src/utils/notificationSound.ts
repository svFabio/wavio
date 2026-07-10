// Sonido de notificación usando Web Audio API
export const playNotificationSound = () => {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Crear oscilador para el tono
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        // Configurar el sonido
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Frecuencia del tono (Hz) - tono agradable
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        // Volumen
        gainNode.gain.value = 0.3;

        // Duración del beep
        const now = audioContext.currentTime;
        oscillator.start(now);

        // Fade out suave
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        oscillator.stop(now + 0.2);

    } catch (error) {
        console.error('Error playing notification sound:', error);
    }
};
