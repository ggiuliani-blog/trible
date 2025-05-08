interface CalculatorDisplayProps {
  display: string;
  target: number;
  timer: number;
  formatTime: (seconds: number) => string;
  onReset: () => void;
  onGiveUp?: () => void;
  showGiveUp: boolean;
}

export const CalculatorDisplay = ({
  display,
  target,
  timer,
  formatTime,
  onReset,
  onGiveUp,
  showGiveUp
}: CalculatorDisplayProps) => {
  const buttonBaseClass = "w-full rounded-lg text-white font-semibold transition-all duration-200 active:scale-95";

  return (
    <div className="space-y-2">
      <div className="text-white text-xl font-bold text-center flex justify-between items-center">
        <span>TARGET: {target}</span>
        <span>Time: {formatTime(timer)}</span>
      </div>
      <div className="bg-gray-200 p-6 rounded-lg min-h-[120px]">
        <div 
          className="text-3xl md:text-4xl font-bold text-gray-900 text-right overflow-x-auto whitespace-nowrap scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          data-testid="calculator-display"
        >
          {display}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onReset}
          className={`${buttonBaseClass} flex-1 bg-red-500 hover:bg-red-600`}
        >
          Reset Current Round
        </button>
        {showGiveUp && onGiveUp && (
          <button
            onClick={onGiveUp}
            className={`${buttonBaseClass} flex-1 bg-yellow-500 hover:bg-yellow-600`}
          >
            Give Up
          </button>
        )}
      </div>
    </div>
  );
}; 