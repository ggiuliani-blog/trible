interface GridNumber {
  value: number;
  used: boolean;
  type: 'small' | 'medium' | 'large';
  position: number;
  usedInRound?: number;
}

interface NumberGridProps {
  gridNumbers: GridNumber[];
  currentCalculationNumbers: number[];
  availableResults: Array<{ value: number }>;
  onNumberClick: (num: number) => void;
}

export const NumberGrid = ({
  gridNumbers,
  currentCalculationNumbers,
  availableResults,
  onNumberClick
}: NumberGridProps) => {
  const buttonBaseClass = "w-full rounded-lg text-white font-semibold transition-all duration-200 active:scale-95";
  const numberButtonClass = `${buttonBaseClass} h-12 text-sm bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed`;

  return (
    <div className="grid grid-cols-4 gap-2">
      {[...Array(12)].map((_, index) => {
        const gridNumber = gridNumbers.find(n => n.position === index);
        if (!gridNumber) return null;

        let buttonClass = numberButtonClass;
        if (gridNumber.type === 'medium') {
          buttonClass = `${numberButtonClass} bg-blue-600 hover:bg-blue-700`;
        } else if (gridNumber.type === 'large') {
          buttonClass = `${numberButtonClass} bg-purple-600 hover:bg-purple-700`;
        }

        // Number is disabled if used in any round or used in current calculation as a grid number
        const isDisabled = gridNumber.used || 
          currentCalculationNumbers.some(n => n === gridNumber.value && !availableResults.some(r => r.value === n));

        return (
          <button
            key={index}
            onClick={() => onNumberClick(gridNumber.value)}
            disabled={isDisabled}
            className={`${buttonClass} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={gridNumber.usedInRound ? `Used in Round ${gridNumber.usedInRound}` : undefined}
          >
            {gridNumber.value}
          </button>
        );
      })}
    </div>
  );
}; 