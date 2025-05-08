interface AvailableResult {
  value: number;
  used: boolean;
  isTarget: boolean;
  roundAchieved: number;
  roundUsed?: number;
}

interface AvailableResultsProps {
  results: AvailableResult[];
  currentCalculationNumbers: number[];
  roundNumber: number;
  onResultClick: (result: AvailableResult) => void;
}

export const AvailableResults = ({
  results,
  currentCalculationNumbers,
  roundNumber,
  onResultClick
}: AvailableResultsProps) => {
  const buttonBaseClass = "w-full rounded-lg text-white font-semibold transition-all duration-200 active:scale-95";
  const resultButtonClass = `${buttonBaseClass} h-10 text-base bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed`;

  return (
    <div className="space-y-1">
      <div className="text-white text-sm font-semibold mb-1">Available Results:</div>
      <div className="grid grid-cols-4 gap-1.5 min-h-[60px]">
        {results.length > 0 ? (
          results.map((result, index) => {
            let buttonStyle = resultButtonClass;
            if (result.isTarget && result.roundAchieved < roundNumber) {
              buttonStyle = `${buttonBaseClass} h-8 text-sm bg-green-800 hover:bg-green-900 disabled:opacity-50 disabled:cursor-not-allowed`;
            } else if (result.isTarget) {
              buttonStyle = `${buttonBaseClass} h-8 text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed`;
            } else {
              buttonStyle = `${buttonBaseClass} h-8 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed`;
            }

            // Disable only if this specific result is used or used in current calculation as a result
            const isDisabled = result.used || 
              currentCalculationNumbers.some(n => n === result.value && results.some(r => r.value === n));

            return (
              <button
                key={index}
                onClick={() => onResultClick(result)}
                disabled={isDisabled}
                className={`${buttonStyle} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {result.value}
              </button>
            );
          })
        ) : (
          <div className="col-span-4 flex items-center justify-center text-gray-400 text-sm">
            No results available
          </div>
        )}
      </div>
    </div>
  );
}; 