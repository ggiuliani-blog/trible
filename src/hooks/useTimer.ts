import { useState, useEffect } from 'react';

interface TimerHook {
  timer: number;
  isTimerRunning: boolean;
  hasStartedRound: boolean;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  formatTime: (seconds: number) => string;
}

export const useTimer = (): TimerHook => {
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [hasStartedRound, setHasStartedRound] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const startTimer = () => {
    if (!hasStartedRound) {
      setIsTimerRunning(true);
      setHasStartedRound(true);
    }
  };

  const stopTimer = () => {
    setIsTimerRunning(false);
  };

  const resetTimer = () => {
    setTimer(0);
    setIsTimerRunning(false);
    setHasStartedRound(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    timer,
    isTimerRunning,
    hasStartedRound,
    startTimer,
    stopTimer,
    resetTimer,
    formatTime,
  };
}; 