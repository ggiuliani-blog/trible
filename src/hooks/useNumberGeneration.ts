import { useState } from 'react';

interface GridNumber {
  value: number;
  used: boolean;
  type: 'small' | 'medium' | 'large';
  position: number;
  usedInRound?: number;
}

interface NumberPool {
  small: number[];
  medium: number[];
  large: number[];
}

interface TargetResult {
  target: number;
  solution?: string;
}

export const useNumberGeneration = () => {
  const generateRandomNumbers = (): GridNumber[] => {
    const getRandomItems = (arr: number[], count: number) => {
      const shuffled = [...arr].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    };

    const smallNumbers = getRandomItems(
      Array.from({ length: 19 }, (_, i) => i + 1),
      8
    ).sort((a, b) => a - b);

    const mediumPool = [20, 25, 50, 75];
    const mediumNumbers = getRandomItems(mediumPool, 2).sort((a, b) => a - b);

    const largePool = [250, 500, 750, 1000, 2000];
    const largeNumbers = getRandomItems(largePool, 2).sort((a, b) => a - b);

    return [
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
  };

  const generateTarget = (numbers: NumberPool, isThirdRound: boolean = false): TargetResult => {
    if (isThirdRound) {
      const allNumbers = [...numbers.small, ...numbers.medium, ...numbers.large];
      if (allNumbers.length === 0) return { target: 0, solution: "0" };
      if (allNumbers.length === 1) return { target: allNumbers[0], solution: allNumbers[0].toString() };

      allNumbers.sort((a, b) => a - b);
      let target = allNumbers[0];
      let solution = target.toString();
      
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

  const [initialGridNumbers] = useState(generateRandomNumbers);

  return {
    initialGridNumbers,
    generateTarget,
    generateRandomNumbers,
  };
}; 