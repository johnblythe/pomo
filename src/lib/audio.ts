/**
 * Generates a pleasant chime sound using Web Audio API
 * No external sound file needed
 */

export function playCompletionSound() {
  const audioContext = new AudioContext();

  // Create oscillator for the tone
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  // Connect nodes
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Configure sound - a pleasant bell-like tone
  oscillator.frequency.value = 830; // High C note
  oscillator.type = 'sine';

  // Configure volume envelope (fade in/out for smoothness)
  const now = audioContext.currentTime;
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

  // Play for 0.5 seconds
  oscillator.start(now);
  oscillator.stop(now + 0.5);
  
  // Cleanup
  oscillator.onended = () => {
    audioContext.close();
  };
}

/**
 * Play a double-chime for work session completion (more noticeable)
 */
export function playWorkCompleteSound() {
  playCompletionSound();
  setTimeout(() => playCompletionSound(), 150);
}

/**
 * Play a single soft chime for break completion
 */
export function playBreakCompleteSound() {
  const audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Lower, softer tone for breaks
  oscillator.frequency.value = 523; // Middle C
  oscillator.type = 'sine';

  const now = audioContext.currentTime;
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.2, now + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

  oscillator.start(now);
  oscillator.stop(now + 0.4);

  oscillator.onended = () => {
    audioContext.close();
  };
}