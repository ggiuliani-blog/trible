import { useState, useEffect } from 'react';
import { useTimer } from '../hooks/useTimer';
import { useNumberGeneration } from '../hooks/useNumberGeneration';
import { CalculatorDisplay } from './CalculatorDisplay';
import { NumberGrid } from './NumberGrid';
import { AvailableResults } from './AvailableResults';
import { Operators } from './Operators';
import { TribalWangCelebration } from './TribalWangCelebration';

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
  const { initialGridNumbers, generateTarget } = useNumberGeneration();
  const { timer, isTimerRunning, hasStartedRound, startTimer, stopTimer, resetTimer, formatTime } = useTimer();

  const [display, setDisplay] = useState('0');
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
  const [roundStartResults, setRoundStartResults] = useState<AvailableResult[]>([]);
  const [showingSolution, setShowingSolution] = useState(false);
  const [showingCelebration, setShowingCelebration] = useState(false);
  const [nextRoundState, setNextRoundState] = useState<{
    numbers: { small: number[], medium: number[], large: number[] };
    target: number;
    solution?: string;
  } | null>(null);

  // Track wrong guesses for TribalWang
  const [wrongGuesses, setWrongGuesses] = useState<number[]>([]);

  // Reset wrong guesses when round changes
  useEffect(() => {
    setWrongGuesses([]);
  }, [roundNumber]);

  // Determine if TribalWang feature is enabled and this is a TribalWang round (every 2nd round)
  const tribalWangEnabled = import.meta.env.VITE_TRIBALWANG === 'true';
  const isTribalRound = tribalWangEnabled && roundNumber % 2 === 0;

  // Handle TribalWang guess
  const handleTribalWangGuess = (num: number) => {
    startTimer();
    if (num === target) {
      setIsSuccess(true);
      stopTimer();
      const celebrationTimer = setTimeout(() => {
        setShowingCelebration(false);
      }, 10000);
      setShowingCelebration(true);

      setRoundResults(prev => [...prev, {
        target: target,
        solution: num.toString(),
        numbersUsed: [num],
        roundNumber: roundNumber,
        timeInSeconds: timer
      }]);
      
      // Mark the correct guess as used for future rounds
      setGridNumbers(prev =>
        prev.map(n =>
          n.value === num
            ? { ...n, used: true, usedInRound: roundNumber }
            : n
        )
      );
      
      // Set up next round with remaining numbers
      const remainingNumbers = {
        small: gridNumbers.filter(n => n.type === 'small' && !n.used && n.value !== num).map(n => n.value),
        medium: gridNumbers.filter(n => n.type === 'medium' && !n.used && n.value !== num).map(n => n.value),
        large: gridNumbers.filter(n => n.type === 'large' && !n.used && n.value !== num).map(n => n.value)
      };
      
      setNextRoundState({
        numbers: remainingNumbers,
        target: generateTarget(remainingNumbers).target
      });
    } else {
      // Add to wrong guesses
      setWrongGuesses(prev => [...prev, num]);
      // Mark wrong guesses as used for future rounds
      setGridNumbers(prev =>
        prev.map(n =>
          n.value === num
            ? { ...n, used: true, usedInRound: roundNumber }
            : n
        )
      );
      // Show incorrect guess feedback
      setDisplay('❌ Wrong guess!');
      setTimeout(() => setDisplay('0'), 1000);
    }
  };

  const handleNumberClick = (num: number) => {
    if (isTribalRound) {
      handleTribalWangGuess(num);
      return;
    }

    if (currentCalculationNumbers.some(n => n === num && !availableResults.some(r => r.value === n))) {
      return;
    }

    startTimer();
    
    setDisplay(prev => prev === '0' ? num.toString() : prev + num);
    setCurrentCalculationNumbers(prev => [...prev, num]);
    
    setGridNumbers(prev => 
      prev.map(n => 
        n.value === num 
          ? { ...n, used: true, usedInRound: roundNumber }
          : n
      )
    );
  };

  const handleResultClick = (result: AvailableResult) => {
    if (currentCalculationNumbers.some(n => n === result.value && availableResults.some(r => r.value === n))) {
      return;
    }

    if (!result.used) {
      startTimer();
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
      resetTimer();
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
      resetTimer();
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
        stopTimer();
        
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

  const handleNextRound = () => {
    if (nextRoundState) {
      const nextRoundNumber = roundNumber + 1;
      setRoundNumber(nextRoundNumber);
      setShowingSolution(false);
      
      // Keep all previously used numbers disabled, including from TribalWang rounds
      setGridNumbers(prev =>
        prev.map(n => ({
          ...n,
          used: n.usedInRound !== undefined,
          usedInRound: n.usedInRound // Preserve the round where it was used
        }))
      );

      // Save the current available results as the starting state for this round
      const startResults = availableResults.filter(result => 
        result.roundAchieved < roundNumber || result.isTarget
      );
      setRoundStartResults(startResults);
      setAvailableResults(startResults);

      // For TribalWang rounds (even numbers), select a random number from available numbers
      const isTribalWangRound = tribalWangEnabled && nextRoundNumber % 2 === 0;
      if (isTribalWangRound) {
        const availableNumbers = [
          ...nextRoundState.numbers.small,
          ...nextRoundState.numbers.medium,
          ...nextRoundState.numbers.large
        ];
        if (availableNumbers.length > 0) {
          const randomIndex = Math.floor(Math.random() * availableNumbers.length);
          const tribalWangTarget = availableNumbers[randomIndex];
          setTarget(tribalWangTarget);
          setNextRoundState({ ...nextRoundState, target: tribalWangTarget });
        }
      } else {
        // For round 3, generate target using only remaining unused numbers
        const isThirdRound = nextRoundNumber === 3;
        const { target, solution } = generateTarget(nextRoundState.numbers, isThirdRound);
        setTarget(target);
        if (solution) {
          setNextRoundState({ ...nextRoundState, solution });
        }
      }
      
      setDisplay('0');
      setCurrentCalculationNumbers([]);
      setIsSuccess(false);
      resetTimer();
    }
  };

  // Add give up handler
  const handleGiveUp = () => {
    setShowingSolution(true);
    stopTimer();
  };

  const buttonBaseClass = "w-full rounded-lg text-white font-semibold transition-all duration-200 active:scale-95";
  const numberButtonClass = `${buttonBaseClass} h-12 text-sm bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed`;
  const operatorButtonClass = `${buttonBaseClass} h-10 text-base bg-orange-500 hover:bg-orange-600`;
  const deleteButtonClass = `${buttonBaseClass} h-10 text-base bg-red-500 hover:bg-red-600`;
  const resultButtonClass = `${buttonBaseClass} h-10 text-base bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed`;

  // Remove the line break formatting
  const formattedDisplay = display;

  const startNewChampionship = () => {
    const newInitialNumbers = initialGridNumbers;
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
    resetTimer();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-900 p-4">
      {/* Show TribalWang celebration */}
      {showingCelebration && (
        <TribalWangCelebration onComplete={() => setShowingCelebration(false)} />
      )}

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
      {((isSuccess && !showingCelebration) || gameComplete) && (
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
            <CalculatorDisplay
              display={display}
              target={target}
              timer={timer}
              formatTime={formatTime}
              onReset={() => handleReset(false)}
              onGiveUp={handleGiveUp}
              showGiveUp={roundNumber === 3 && !isSuccess}
              tribalWangEnabled={tribalWangEnabled}
              roundNumber={roundNumber}
            />

            {/* Show remaining numbers for TribalWang guessing */}
            {isTribalRound ? (
              <div className="grid grid-cols-3 gap-4">
                {/* Show available results as regular numbers during TribalWang rounds */}
                {availableResults
                  .filter(r => !r.used)
                  .map((result, index) => (
                    <div key={`result-${index}`} className="relative">
                      <button
                        onClick={() => handleNumberClick(result.value)}
                        className={`${buttonBaseClass} h-12 text-lg ${
                          wrongGuesses.includes(result.value)
                            ? 'bg-red-500 cursor-not-allowed opacity-50'
                            : 'bg-purple-600 hover:bg-purple-700'
                        }`}
                        disabled={wrongGuesses.includes(result.value)}
                      >
                        {result.value}
                        {wrongGuesses.includes(result.value) && (
                          <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl">
                            ❌
                          </span>
                        )}
                      </button>
                    </div>
                  ))}
                {/* Show regular numbers */}
                {gridNumbers
                  .filter(n => !n.used)
                  .map((number, index) => (
                    <div key={index} className="relative">
                      <button
                        onClick={() => handleNumberClick(number.value)}
                        className={`${buttonBaseClass} h-12 text-lg ${
                          wrongGuesses.includes(number.value)
                            ? 'bg-red-500 cursor-not-allowed opacity-50'
                            : 'bg-purple-600 hover:bg-purple-700'
                        }`}
                        disabled={wrongGuesses.includes(number.value)}
                      >
                        {number.value}
                        {wrongGuesses.includes(number.value) && (
                          <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl">
                            ❌
                          </span>
                        )}
                      </button>
                    </div>
                  ))}
              </div>
            ) : (
              <>
                <AvailableResults
                  results={availableResults}
                  currentCalculationNumbers={currentCalculationNumbers}
                  roundNumber={roundNumber}
                  onResultClick={handleResultClick}
                />
                <NumberGrid
                  gridNumbers={gridNumbers}
                  currentCalculationNumbers={currentCalculationNumbers}
                  availableResults={availableResults}
                  onNumberClick={handleNumberClick}
                />

                <Operators
                  onOperatorClick={handleOperatorClick}
                  onDelete={handleDelete}
                />
              </>
            )}
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