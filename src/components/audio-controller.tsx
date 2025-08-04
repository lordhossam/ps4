"use client";

import React from 'react';

export const AudioController = () => {
  return (
    <>
      <audio id="calculateSound" src="https://assets.mixkit.co/sfx/preview/mixkit-cash-register-purchase-2759.mp3" preload="auto"></audio>
      <audio id="pdfSound" src="https://assets.mixkit.co/sfx/preview/mixkit-positive-interface-beep-221.mp3" preload="auto"></audio>
      <audio id="timerSound" src="https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3" preload="auto"></audio>
    </>
  );
};

export const playSound = (soundId: 'calculate' | 'pdf' | 'timer') => {
  if (typeof window !== 'undefined') {
    const audio = document.getElementById(`${soundId}Sound`) as HTMLAudioElement;
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(error => console.error(`Error playing sound ${soundId}:`, error));
    }
  }
};
