import { useState } from 'react';

interface Calculation {
  expression: string;
  result: number;
  usedNumbers: number[];  // Track numbers used in this calculation
}

interface AvailableResult {
  value: number;
  used: boolean;
}

const Calculator = () => {
  const [display, setDisplay] = useState('0');
  const [target, setTarget] = useState(75);
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [usedNumbers, setUsedNumbers] = useState<number[]>([]);
  const [availableResults, setAvailableResults] = useState<AvailableResult[]>([]);
  const [currentCalculationNumbers, setCurrentCalculationNumbers] = useState<number[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);

  const numbers = [1, 2, 3, 10, 25, 50];

  const handleNumberClick = (num: number) => {
    setDisplay(prev => prev === '0' ? num.toString() : prev + num);
    if (!usedNumbers.includes(num)) {
      setUsedNumbers(prev => [...prev, num]);
      setCurrentCalculationNumbers(prev => [...prev, num]);
    }
  };

  const handleResultClick = (result: AvailableResult) => {
    if (!result.used) {
      setDisplay(prev => prev === '0' ? result.value.toString() : prev + result.value);
      // Mark the result as used
      setAvailableResults(prev =>
        prev.map(r => r.value === result.value ? { ...r, used: true } : r)
      );
    }
  };

  const handleOperatorClick = (operator: string) => {
    if (operator === '=') {
      calculateResult();
    } else {
      setDisplay(prev => prev + ' ' + operator + ' ');
    }
  };

  const handleReset = () => {
    setDisplay('0');
    setUsedNumbers([]);
    setAvailableResults([]);
    setCalculations([]);
    setCurrentCalculationNumbers([]);
    setIsSuccess(false);
  };

  const handleDelete = () => {
    setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
  };

  const handleRemoveLastCalculation = () => {
    if (calculations.length > 0) {
      // Get the last calculation
      const lastCalc = calculations[calculations.length - 1];

      // Remove the last calculation from history
      setCalculations(prev => prev.slice(0, -1));

      // Re-enable the numbers used in this calculation
      setUsedNumbers(prev => 
        prev.filter(num => !lastCalc.usedNumbers.includes(num))
      );

      // Remove its result from available results
      setAvailableResults(prev => {
        const lastResultIndex = prev.findIndex(r => r.value === lastCalc.result);
        if (lastResultIndex !== -1) {
          return prev.filter((_, index) => index !== lastResultIndex);
        }
        return prev;
      });
    }
  };

  const calculateResult = () => {
    try {
      const cleanExpression = display.trim().replace(/\s+/g, '');
      if (!/^[0-9+\-*/()\s.]+$/.test(cleanExpression)) {
        throw new Error('Invalid expression');
      }
      const result = new Function('return ' + cleanExpression)();
      if (typeof result !== 'number' || !isFinite(result)) {
        throw new Error('Invalid result');
      }
      
      // Add the calculation to history and available results
      setCalculations(prev => [...prev, { 
        expression: display, 
        result,
        usedNumbers: [...currentCalculationNumbers] // Store the numbers used in this calculation
      }]);
      setAvailableResults(prev => [...prev, { value: result, used: false }]);
      
      // Check if the result matches the target
      if (result === target) {
        setIsSuccess(true);
      }

      // Clear the display and current calculation numbers for the next calculation
      setDisplay('0');
      setCurrentCalculationNumbers([]);
    } catch (error) {
      setDisplay('Error');
      setTimeout(() => {
        setDisplay('0');
      }, 1000);
    }
  };

  const buttonBaseClass = "w-full h-14 rounded-lg text-white text-xl font-semibold transition-all duration-200 active:scale-95";
  const numberButtonClass = `${buttonBaseClass} bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed`;
  const operatorButtonClass = `${buttonBaseClass} bg-orange-500 hover:bg-orange-600`;
  const deleteButtonClass = `${buttonBaseClass} bg-red-500 hover:bg-red-600`;
  const resultButtonClass = `${buttonBaseClass} bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed`;

  // Format display with line breaks before operators
  const formattedDisplay = display.replace(/([+\-*/])/g, '\n$1');

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-900 p-4">
      {isSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-green-500 text-white p-8 rounded-xl shadow-2xl transform scale-110 animate-bounce">
            <h2 className="text-4xl font-bold text-center">Well done genius! 🎉</h2>
            <button
              onClick={handleReset}
              className="mt-6 w-full bg-white text-green-500 py-2 rounded-lg hover:bg-gray-100 transition-colors font-bold"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-6">
        {/* Calculator Panel */}
        <div className="w-full md:w-1/2 bg-gray-800 rounded-2xl shadow-2xl p-6 space-y-4">
          <div className="space-y-2">
            <div className="text-white text-xl font-bold text-center">TARGET: {target}</div>
            <div className="bg-gray-200 p-6 rounded-lg min-h-[120px]">
              <div 
                className="text-3xl md:text-4xl font-bold text-gray-900 text-right whitespace-pre-wrap break-words"
                data-testid="calculator-display"
              >
                {formattedDisplay}
              </div>
            </div>
            <button
              onClick={handleReset}
              className={`${buttonBaseClass} w-full bg-red-500 hover:bg-red-600`}
            >
              RESET
            </button>
          </div>

          {/* Available Results */}
          {availableResults.length > 0 && (
            <div className="space-y-2">
              <div className="text-white text-lg font-semibold">Available Results:</div>
              <div className="grid grid-cols-3 gap-2">
                {availableResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleResultClick(result)}
                    disabled={result.used}
                    className={resultButtonClass}
                  >
                    {result.value}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            {numbers.map((num) => (
              <button
                key={num}
                onClick={() => handleNumberClick(num)}
                disabled={usedNumbers.includes(num)}
                className={numberButtonClass}
              >
                {num}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => handleOperatorClick('(')} className={operatorButtonClass}>(</button>
            <button onClick={() => handleOperatorClick(')')} className={operatorButtonClass}>)</button>
            <button onClick={handleDelete} className={deleteButtonClass}>DEL</button>
            <button onClick={() => handleOperatorClick('+')} className={operatorButtonClass}>+</button>
            <button onClick={() => handleOperatorClick('-')} className={operatorButtonClass}>-</button>
            <button onClick={() => handleOperatorClick('=')} className={`${operatorButtonClass} font-bold`}>=</button>
            <button onClick={() => handleOperatorClick('/')} className={operatorButtonClass}>/</button>
            <button onClick={() => handleOperatorClick('*')} className={operatorButtonClass}>*</button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="w-full md:w-1/2 bg-gray-800 rounded-2xl shadow-2xl p-6">
          <div className="text-white text-xl font-bold mb-4">Calculation History</div>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {calculations.length === 0 ? (
              <div className="text-gray-400 text-center py-4">No calculations yet</div>
            ) : (
              calculations.map((calc, index) => (
                <div key={index} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-gray-300 text-lg">{calc.expression}</div>
                      <div className="text-2xl font-bold text-white">= {calc.result}</div>
                      <div className="text-sm text-gray-400 mt-1">
                        Used numbers: {calc.usedNumbers.join(', ')}
                      </div>
                    </div>
                    {index === calculations.length - 1 && (
                      <button
                        onClick={handleRemoveLastCalculation}
                        className="ml-4 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          {calculations.length > 0 && (
            <button
              onClick={handleReset}
              className="mt-4 w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calculator; 