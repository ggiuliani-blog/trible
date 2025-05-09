import { useEffect } from 'react';

interface TribalWangCelebrationProps {
  onComplete: () => void;
}

export const TribalWangCelebration = ({ onComplete }: TribalWangCelebrationProps) => {
  useEffect(() => {
    // Play the celebration sound
    const audio = new Audio('/tribelwanger.mp3');
    audio.play().catch(err => console.log('Audio playback failed:', err));

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="relative">
        {/* Spinning TribalWang text */}
        <div className="animate-spin-slow text-8xl font-bold text-yellow-400 tracking-wider relative z-10">
          TRIBAL<span className="text-purple-500">WANGER</span>
        </div>
        
        {/* Stars */}
        <div className="absolute inset-0 -z-10">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-twinkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`
              }}
            >
              ⭐
            </div>
          ))}
        </div>

        {/* Confetti */}
        <div className="absolute inset-0 -z-10">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-20%`,
                animationDelay: `${Math.random() * 3}s`,
                backgroundColor: ['#FF69B4', '#FFD700', '#7B68EE', '#00FA9A'][Math.floor(Math.random() * 4)]
              }}
            >
              <div className="w-2 h-2 rotate-45" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 