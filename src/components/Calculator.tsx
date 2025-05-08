import { useState, useEffect } from 'react';

interface Calculation {
  expression: string;
  result: number;
  usedNumbers: number[];  // Track numbers used in this calculation
  usedResults: number[];  // Track results used in this calculation
}

interface AvailableResult {
  value: number;
  used: boolean;
  isTarget: boolean;
  roundAchieved: number;
  roundUsed?: number; // Track which round the number was used in
}

interface RoundResult {
  target: number;
  solution: string;
  numbersUsed: number[];
  roundNumber: number;
  timeInSeconds: number; // Add time tracking
}

interface RoundState {
  numbers: {
    small: number[];
    medium: number[];
    large: number[];
  };
  target: number;
  solution?: string; // Add solution to store for round 3
}

interface GridNumber {
  value: number;
  used: boolean;
  type: 'small' | 'medium' | 'large';
  position: number;
  usedInRound?: number; // Track which round the number was used in
}

const Calculator = () => {
  const generateRandomNumbers = () => {
    // Helper function to get random items from array
    const getRandomItems = (arr: number[], count: number) => {
      const shuffled = [...arr].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    };

    // Generate 8 unique random numbers from 1-19
    const smallNumbers = getRandomItems(
      Array.from({ length: 19 }, (_, i) => i + 1),
      8
    ).sort((a, b) => a - b);

    // Get 2 random numbers from medium pool
    const mediumPool = [20, 25, 50, 75];
    const mediumNumbers = getRandomItems(mediumPool, 2).sort((a, b) => a - b);

    // Get 2 random numbers from large pool
    const largePool = [250, 500, 750, 1000, 2000];
    const largeNumbers = getRandomItems(largePool, 2).sort((a, b) => a - b);

    // Create grid numbers with fixed positions
    const gridNumbers: GridNumber[] = [
      ...smallNumbers.map((value, index) => ({
        value,
        used: false,
        type: 'small' as const,
        position: index
      })),
      ...mediumNumbers.map((value, index) => ({
        value,
        used: false,
        type: 'medium' as const,
        position: 8 + index
      })),
      ...largeNumbers.map((value, index) => ({
        value,
        used: false,
        type: 'large' as const,
        position: 10 + index
      }))
    ];

    return gridNumbers;
  };

  const generateTarget = (numbers: { small: number[], medium: number[], large: number[] }, isThirdRound: boolean = false) => {
    if (isThirdRound) {
      const allNumbers = [...numbers.small, ...numbers.medium, ...numbers.large];
      if (allNumbers.length === 0) return { target: 0, solution: "0" };
      if (allNumbers.length === 1) return { target: allNumbers[0], solution: allNumbers[0].toString() };

      // Sort numbers to handle them in a strategic order
      allNumbers.sort((a, b) => a - b);

      // Initialize target with the first number
      let target = allNumbers[0];
      let solution = target.toString();
      
      // Use all remaining numbers to build the target
      for (let i = 1; i < allNumbers.length; i++) {
        const number = allNumbers[i];
        
        if (target <= 100 && number <= 100) {
          target = target * number;
          solution = `(${solution} * ${number})`;
        } else {
          target = target + number;
          solution = `(${solution} + ${number})`;
        }
      }
      
      return { target, solution };
    }

    // Original target generation for rounds 1 and 2
    const allNumbers = [...numbers.small, ...numbers.medium, ...numbers.large];
    const numCount = Math.floor(Math.random() * 3) + 2;
    const selectedNumbers = [];
    let target = 0;
    
    for (let i = 0; i < numCount; i++) {
      if (allNumbers.length === 0) break;
      
      const randomIndex = Math.floor(Math.random() * allNumbers.length);
      const number = allNumbers[randomIndex];
      selectedNumbers.push(number);
      allNumbers.splice(randomIndex, 1);
      
      if (i === 0) {
        target = number;
      } else {
        const operation = Math.random() < 0.7 ? '+' : '*';
        target = operation === '+' ? target + number : target * number;
      }
    }
    
    return { target };
  };

  const [display, setDisplay] = useState('0');
  const [initialGridNumbers] = useState(generateRandomNumbers);
  const [gridNumbers, setGridNumbers] = useState(initialGridNumbers);
  const [originalTarget] = useState(() => generateTarget({ 
    small: initialGridNumbers.filter(n => n.type === 'small').map(n => n.value),
    medium: initialGridNumbers.filter(n => n.type === 'medium').map(n => n.value),
    large: initialGridNumbers.filter(n => n.type === 'large').map(n => n.value)
  }));
  const [target, setTarget] = useState(originalTarget.target);
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [usedNumbers, setUsedNumbers] = useState<number[]>([]);
  const [availableResults, setAvailableResults] = useState<AvailableResult[]>([]);
  const [currentCalculationNumbers, setCurrentCalculationNumbers] = useState<number[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [roundNumber, setRoundNumber] = useState(1);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [gameComplete, setGameComplete] = useState(false);

  // Add timer state
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [hasStartedRound, setHasStartedRound] = useState(false);

  // Format time function
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Remove timer start from useEffect
  useEffect(() => {
    if (!isSuccess) {
      setTimer(0);
      setHasStartedRound(false);
    }
  }, [roundNumber, isSuccess]);

  const handleNumberClick = (num: number) => {
    // Check if this specific grid number is already used in current calculation
    if (currentCalculationNumbers.some(n => n === num && !availableResults.some(r => r.value === n))) {
      return;
    }

    // Start timer on first number click of the round
    if (!hasStartedRound) {
      setIsTimerRunning(true);
      setHasStartedRound(true);
    }
    
    setDisplay(prev => prev === '0' ? num.toString() : prev + num);
    setCurrentCalculationNumbers(prev => [...prev, num]);
    
    // Mark the number as used immediately
    setGridNumbers(prev => 
      prev.map(n => 
        n.value === num 
          ? { ...n, used: true, usedInRound: roundNumber }
          : n
      )
    );
  };

  const handleResultClick = (result: AvailableResult) => {
    // Check if this specific result is already used in current calculation
    if (currentCalculationNumbers.some(n => n === result.value && availableResults.some(r => r.value === n))) {
      return;
    }

    if (!result.used) {
      // Start timer on first number click of the round
      if (!hasStartedRound) {
        setIsTimerRunning(true);
        setHasStartedRound(true);
      }

      setDisplay(prev => prev === '0' ? result.value.toString() : prev + result.value);
      setCurrentCalculationNumbers(prev => [...prev, result.value]);
    }
  };

  const handleOperatorClick = (operator: string) => {
    if (operator === '=') {
      calculateResult();
    } else {
      setDisplay(prev => prev + ' ' + operator + ' ');
    }
  };

  // Add state to track available results at start of round
  const [roundStartResults, setRoundStartResults] = useState<AvailableResult[]>([]);

  const handleReset = (fromProgress: boolean = false, roundToReset?: number) => {
    if (fromProgress && roundToReset) {
      if (roundToReset !== roundNumber - 1) {
        return;
      }

      const previousRound = roundToReset - 1;
      const previousRoundResults = roundResults.filter(result => result.roundNumber <= previousRound);
      
      setRoundResults(previousRoundResults);
      setRoundNumber(roundToReset);

      // Reset grid numbers but keep numbers used in previous rounds disabled
      setGridNumbers(prev =>
        prev.map(n => ({
          ...n,
          used: n.usedInRound !== undefined && n.usedInRound < roundToReset,
          usedInRound: n.usedInRound !== undefined && n.usedInRound < roundToReset ? n.usedInRound : undefined
        }))
      );

      // Find available results from the end of the previous round
      // and maintain their used state
      const availableResultsAtPreviousRound = availableResults
        .filter(result => result.roundAchieved <= previousRound)
        .map(result => ({
          ...result,
          used: result.roundUsed !== undefined && result.roundUsed <= previousRound
        }));

      setAvailableResults(availableResultsAtPreviousRound);
      setRoundStartResults(availableResultsAtPreviousRound);

      setDisplay('0');
      setCurrentCalculationNumbers([]);
      setCalculations([]);
      setIsSuccess(false);
      setNextRoundState(null);
      setTimer(0);
      setIsTimerRunning(false);
      setHasStartedRound(false);
    } else {
      // Regular reset (current round only)
      setDisplay('0');
      
      // Re-enable all numbers that were used in the current round only
      setGridNumbers(prev =>
        prev.map(n => ({
          ...n,
          used: n.usedInRound !== undefined && n.usedInRound < roundNumber,
          usedInRound: n.usedInRound !== undefined && n.usedInRound < roundNumber ? n.usedInRound : undefined
        }))
      );

      // Restore available results to the state at the start of the round
      // Only keep the used state for results used in previous rounds
      setAvailableResults(roundStartResults.map(result => ({
        ...result,
        used: result.roundUsed !== undefined && result.roundUsed < roundNumber
      })));

      setCurrentCalculationNumbers([]);
      setCalculations([]);
      setTimer(0);
      setIsTimerRunning(false);
      setHasStartedRound(false);
    }
  };

  const handleDelete = () => {
    if (display === '0') return;

    const tokens = display.trim().split(/\s*([-+*/])\s*/).filter(Boolean);
    tokens.pop();
    
    if (tokens.length === 0) {
      setDisplay('0');
      // Re-enable numbers that were going to be used in this calculation
      const numbersToReenable = currentCalculationNumbers;
      setGridNumbers(prev =>
        prev.map(n =>
          numbersToReenable.includes(n.value) && n.usedInRound === roundNumber
            ? { ...n, used: false, usedInRound: undefined }
            : n
        )
      );
      setCurrentCalculationNumbers([]);
      return;
    }

    const lastToken = tokens[tokens.length - 1];
    if (!/[-+*/]/.test(lastToken)) {
      const numberToRemove = parseInt(lastToken);
      // Re-enable the number if it was used in current round
      setGridNumbers(prev =>
        prev.map(n =>
          n.value === numberToRemove && n.usedInRound === roundNumber
            ? { ...n, used: false, usedInRound: undefined }
            : n
        )
      );
      setCurrentCalculationNumbers(prev => prev.filter(num => num !== numberToRemove));
    }

    const newDisplay = tokens.reduce((acc, token, index) => {
      if (/[-+*/]/.test(token)) {
        return `${acc} ${token} `;
      }
      return acc + token;
    }, '');

    setDisplay(newDisplay.trim());
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

      // Separate grid numbers and results used in this calculation
      const numbersUsedInCalculation = currentCalculationNumbers.filter(
        num => !availableResults.some(r => r.value === num)
      );
      const resultsUsedInCalculation = currentCalculationNumbers.filter(
        num => availableResults.some(r => r.value === num)
      );

      // Mark grid numbers used in this calculation as permanently used
      setGridNumbers(prev =>
        prev.map(n =>
          numbersUsedInCalculation.includes(n.value)
            ? { ...n, used: true, usedInRound: roundNumber }
            : n
        )
      );

      // Mark results used in this calculation as permanently used
      setAvailableResults(prev =>
        prev.map(r =>
          resultsUsedInCalculation.includes(r.value)
            ? { ...r, used: true, roundUsed: roundNumber }
            : r
        )
      );
      
      setCalculations(prev => [...prev, { 
        expression: display, 
        result,
        usedNumbers: numbersUsedInCalculation,
        usedResults: resultsUsedInCalculation
      }]);
      
      if (result === target) {
        setIsSuccess(true);
        setIsTimerRunning(false);
        
        // Update available results with the target
        const updatedResults = [...availableResults];
        if (!updatedResults.some(r => r.value === target)) {
          updatedResults.push({ 
            value: target, 
            used: false, 
            isTarget: true, 
            roundAchieved: roundNumber 
          });
        }
        setAvailableResults(updatedResults);
        
        // Save this state as the start state for the next round
        // Only include results from previous rounds and the newly achieved target
        const nextRoundStartResults = updatedResults.filter(result => 
          result.roundAchieved < roundNumber || (result.isTarget && result.roundAchieved === roundNumber)
        );
        setRoundStartResults(nextRoundStartResults);

        setRoundResults(prev => [...prev, {
          target: target,
          solution: display,
          numbersUsed: numbersUsedInCalculation,
          roundNumber: roundNumber,
          timeInSeconds: timer
        }]);

        if (roundNumber === 3) {
          setGameComplete(true);
          return;
        }

        // Only include numbers that haven't been used at all
        const remainingNumbers = {
          small: gridNumbers.filter(n => n.type === 'small' && !n.used).map(n => n.value),
          medium: gridNumbers.filter(n => n.type === 'medium' && !n.used).map(n => n.value),
          large: gridNumbers.filter(n => n.type === 'large' && !n.used).map(n => n.value)
        };
        
        setNextRoundState({
          numbers: remainingNumbers,
          target: generateTarget(remainingNumbers).target
        });
      } else {
        // Only add non-target results if they don't already exist
        if (!availableResults.some(r => r.value === result)) {
          setAvailableResults(prev => [...prev, { 
            value: result, 
            used: false, 
            isTarget: false, 
            roundAchieved: roundNumber
          }]);
        }
      }
      
      setDisplay('0');
      setCurrentCalculationNumbers([]);
    } catch (error) {
      setDisplay('Error');
      setTimeout(() => {
        setDisplay('0');
        setCurrentCalculationNumbers([]);
      }, 1000);
    }
  };

  // Add state for next round
  const [nextRoundState, setNextRoundState] = useState<{
    numbers: { small: number[], medium: number[], large: number[] };
    target: number;
    solution?: string;
  } | null>(null);

  const handleNextRound = () => {
    if (nextRoundState) {
      const nextRoundNumber = roundNumber + 1;
      setRoundNumber(nextRoundNumber);
      setShowingSolution(false);
      
      // Keep all previously used numbers disabled
      setGridNumbers(prev =>
        prev.map(n => ({
          ...n,
          used: n.usedInRound !== undefined
        }))
      );

      // Save the current available results as the starting state for this round
      const startResults = availableResults.filter(result => 
        result.roundAchieved < roundNumber || result.isTarget
      );
      setRoundStartResults(startResults);
      setAvailableResults(startResults);

      // For round 3, generate target using only remaining unused numbers
      const isThirdRound = nextRoundNumber === 3;
      const { target, solution } = generateTarget(nextRoundState.numbers, isThirdRound);
      setTarget(target);
      if (solution) {
        setNextRoundState({ ...nextRoundState, solution });
      }
      
      setDisplay('0');
      setCurrentCalculationNumbers([]);
      setIsSuccess(false);
      setTimer(0);
      setIsTimerRunning(false);
      setHasStartedRound(false);
    }
  };

  // Add give up handler
  const handleGiveUp = () => {
    setShowingSolution(true);
    setIsTimerRunning(false);
  };

  const buttonBaseClass = "w-full rounded-lg text-white font-semibold transition-all duration-200 active:scale-95";
  const numberButtonClass = `${buttonBaseClass} h-12 text-sm bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed`;
  const operatorButtonClass = `${buttonBaseClass} h-10 text-base bg-orange-500 hover:bg-orange-600`;
  const deleteButtonClass = `${buttonBaseClass} h-10 text-base bg-red-500 hover:bg-red-600`;
  const resultButtonClass = `${buttonBaseClass} h-10 text-base bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed`;

  // Remove the line break formatting
  const formattedDisplay = display;

  const startNewChampionship = () => {
    const newInitialNumbers = generateRandomNumbers();
    setGridNumbers(newInitialNumbers);
    const newTarget = generateTarget({ 
      small: newInitialNumbers.filter(n => n.type === 'small').map(n => n.value),
      medium: newInitialNumbers.filter(n => n.type === 'medium').map(n => n.value),
      large: newInitialNumbers.filter(n => n.type === 'large').map(n => n.value)
    }).target;
    setTarget(newTarget);
    setDisplay('0');
    setUsedNumbers([]);
    setAvailableResults([]);
    setRoundStartResults([]);
    setCalculations([]);
    setCurrentCalculationNumbers([]);
    setIsSuccess(false);
    setNextRoundState(null);
    setRoundNumber(1);
    setRoundResults([]);
    setGameComplete(false);
    setTimer(0);
    setIsTimerRunning(false);
    setHasStartedRound(false);
  };

  const [showingSolution, setShowingSolution] = useState(false);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-900 p-4">
      {showingSolution && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 text-white p-8 rounded-xl shadow-2xl transform scale-105 max-w-lg w-full">
            <h2 className="text-2xl font-bold text-center mb-4">Solution</h2>
            <div className="space-y-4">
              <p className="text-lg">Target: {target}</p>
              <p className="text-lg">Solution: {nextRoundState?.solution}</p>
              <div className="mt-6 space-y-4">
                <button
                  onClick={() => setShowingSolution(false)}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-bold"
                >
                  Continue Playing
                </button>
                <button
                  onClick={() => handleReset(false)}
                  className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors font-bold"
                >
                  Reset Round
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {(isSuccess || gameComplete) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`bg-green-500 text-white p-8 rounded-xl shadow-2xl transform ${gameComplete ? 'scale-110' : 'scale-105'}`}>
            {gameComplete ? (
              <div className="text-center space-y-4">
                <div className="text-6xl mb-4">🏆</div>
                <div className="text-yellow-300 text-4xl mb-2">⭐⭐⭐</div>
                <h2 className="text-4xl font-bold">Championship Complete!</h2>
                <div className="mt-4 text-xl">
                  All three rounds completed!
                </div>
                <div className="mt-2 space-y-2">
                  {roundResults.map((result, index) => (
                    <div key={index} className="bg-green-600 rounded-lg p-3 text-sm">
                      <div className="font-bold">Round {result.roundNumber}</div>
                      <div>Target: {result.target}</div>
                      <div>Solution: {result.solution}</div>
                      <div>Time: {formatTime(result.timeInSeconds)}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={startNewChampionship}
                  className="mt-6 w-full bg-white text-green-500 py-3 rounded-lg hover:bg-gray-100 transition-colors font-bold text-xl"
                >
                  Start New Championship 🎮
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-4xl font-bold text-center">Well done genius! 🎉</h2>
                <p className="text-center mt-2">Time: {formatTime(timer)}</p>
                <div className="mt-6 space-y-4">
                  <button
                    onClick={handleNextRound}
                    className="w-full bg-white text-green-500 py-2 rounded-lg hover:bg-gray-100 transition-colors font-bold"
                  >
                    Next Round ({roundNumber}/3)
                  </button>
                  <button
                    onClick={() => handleReset(true)}
                    className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors font-bold"
                  >
                    Reset Current Game
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <div className="w-full max-w-7xl flex gap-4">
        {/* Progress Sidebar */}
        <div className="hidden md:block w-48 bg-gray-800 rounded-2xl shadow-2xl p-4 space-y-4 h-fit">
          <h2 className="text-white text-xl font-bold text-center border-b border-gray-700 pb-2">
            Championship Progress
          </h2>
          <div className="text-center text-white mb-4">
            Original Target: {originalTarget.target}
          </div>
          <div className="text-center text-white mb-4">
            Time: {formatTime(timer)}
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((round) => {
              const roundResult = roundResults.find(r => r.roundNumber === round);
              return (
                <div 
                  key={round}
                  className={`p-4 rounded-lg ${
                    roundResult ? 'bg-green-600' : 
                    round === roundNumber ? 'bg-gray-700' : 'bg-gray-700 opacity-50'
                  }`}
                >
                  <h3 className="text-white font-bold">Round {round}</h3>
                  {roundResult ? (
                    <div className="space-y-1 mt-2">
                      <p className="text-white">Target: {roundResult.target}</p>
                      <p className="text-white text-sm">Solution: {roundResult.solution}</p>
                      <p className="text-white text-sm">Time: {formatTime(roundResult.timeInSeconds)}</p>
                      {round === roundNumber - 1 && (
                        <button
                          onClick={() => handleReset(true, round)}
                          className="mt-2 w-full bg-red-500 text-white py-1 px-2 rounded text-sm hover:bg-red-600 transition-colors"
                        >
                          Reset This Round
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-400 mt-2">
                      {round === roundNumber ? "In Progress" : "Not Started"}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Calculator Panel */}
        <div className="flex-1">
          <div className="w-full bg-gray-800 rounded-2xl shadow-2xl p-6 space-y-4">
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
                  {formattedDisplay}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleReset(false)}
                  className={`${buttonBaseClass} flex-1 bg-red-500 hover:bg-red-600`}
                >
                  Reset Current Round
                </button>
                {roundNumber === 3 && !isSuccess && (
                  <button
                    onClick={handleGiveUp}
                    className={`${buttonBaseClass} flex-1 bg-yellow-500 hover:bg-yellow-600`}
                  >
                    Give Up
                  </button>
                )}
              </div>
            </div>

            {/* Available Results */}
            <div className="space-y-1">
              <div className="text-white text-sm font-semibold mb-1">Available Results:</div>
              <div className="grid grid-cols-4 gap-1.5 min-h-[60px]">
                {availableResults.length > 0 ? (
                  availableResults.map((result, index) => {
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
                      currentCalculationNumbers.some(n => n === result.value && availableResults.some(r => r.value === n));

                    return (
                      <button
                        key={index}
                        onClick={() => handleResultClick(result)}
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
                    onClick={() => handleNumberClick(gridNumber.value)}
                    disabled={isDisabled}
                    className={`${buttonClass} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={gridNumber.usedInRound ? `Used in Round ${gridNumber.usedInRound}` : undefined}
                  >
                    {gridNumber.value}
                  </button>
                );
              })}
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
        </div>

        {/* Results Panel - Moved to right side */}
        <div className="hidden md:block w-72 bg-gray-800 rounded-2xl shadow-2xl p-6 h-fit">
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
              onClick={() => handleReset(false)}
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