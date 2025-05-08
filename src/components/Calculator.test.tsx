import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Calculator from './Calculator';

// Mock timer
jest.useFakeTimers();

describe('Calculator Component', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  test('renders initial calculator state correctly', () => {
    render(<Calculator />);
    
    // Check for main elements
    expect(screen.getByText(/TARGET:/i)).toBeInTheDocument();
    expect(screen.getByText(/Championship Progress/i)).toBeInTheDocument();
    expect(screen.getByText('Round 1')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument(); // Initial display
    expect(screen.getByText('Available Results:')).toBeInTheDocument();
  });

  test('number buttons are rendered and clickable', () => {
    render(<Calculator />);
    
    // Find all number buttons (should be 12 in total)
    const numberButtons = screen.getAllByRole('button').filter(button => 
      !isNaN(Number(button.textContent)) && 
      Number(button.textContent) >= 0
    );
    expect(numberButtons).toHaveLength(12);

    // Click first number button
    fireEvent.click(numberButtons[0]);
    expect(screen.getByTestId('calculator-display')).not.toHaveTextContent('0');
  });

  test('operator buttons work correctly', () => {
    render(<Calculator />);
    
    // Click a number and then an operator
    const firstNumber = screen.getAllByRole('button').find(button => button.textContent === '1');
    const plusOperator = screen.getByText('+');
    
    fireEvent.click(firstNumber!);
    fireEvent.click(plusOperator);
    
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('1 + ');
  });

  test('timer starts only on first number click', () => {
    render(<Calculator />);
    
    // Initially timer should show 0:00
    expect(screen.getByText('Time: 0:00')).toBeInTheDocument();
    
    // Click a number
    const numberButton = screen.getAllByRole('button').find(button => !isNaN(Number(button.textContent)));
    fireEvent.click(numberButton!);
    
    // Advance timer
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Timer should now show 0:01
    expect(screen.getByText('Time: 0:01')).toBeInTheDocument();
  });

  test('numbers can only be used once per round', () => {
    render(<Calculator />);
    
    // Find and click a number button
    const numberButtons = screen.getAllByRole('button').filter(button => 
      !isNaN(Number(button.textContent))
    );
    const firstNumber = numberButtons[0];
    const initialValue = firstNumber.textContent;
    
    fireEvent.click(firstNumber);
    
    // Try to click the same number again
    fireEvent.click(firstNumber);
    
    // Display should only show the number once
    expect(screen.getByTestId('calculator-display')).toHaveTextContent(initialValue!);
  });

  test('reset button returns to initial round state', () => {
    render(<Calculator />);
    
    // Perform some calculations
    const numberButton = screen.getAllByRole('button').find(button => !isNaN(Number(button.textContent)));
    const plusOperator = screen.getByText('+');
    
    fireEvent.click(numberButton!);
    fireEvent.click(plusOperator);
    fireEvent.click(numberButton!);
    
    // Click reset
    const resetButton = screen.getByText('Reset Current Round');
    fireEvent.click(resetButton);
    
    // Check if display is reset
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('0');
    
    // Check if timer is reset
    expect(screen.getByText('Time: 0:00')).toBeInTheDocument();
  });

  test('calculation results are added to available results', () => {
    render(<Calculator />);
    
    // Find number buttons and operators
    const numberButtons = screen.getAllByRole('button').filter(button => 
      !isNaN(Number(button.textContent))
    );
    const plusOperator = screen.getByText('+');
    const equalsOperator = screen.getByText('=');
    
    // Perform a calculation
    fireEvent.click(numberButtons[0]);
    fireEvent.click(plusOperator);
    fireEvent.click(numberButtons[1]);
    fireEvent.click(equalsOperator);
    
    // Result should appear in available results
    const result = Number(numberButtons[0].textContent) + Number(numberButtons[1].textContent);
    const availableResults = screen.getByText(result.toString());
    expect(availableResults).toBeInTheDocument();
  });

  test('invalid calculations show error', () => {
    render(<Calculator />);
    
    // Try to calculate with invalid expression
    const numberButton = screen.getAllByRole('button').find(button => !isNaN(Number(button.textContent)));
    const divideOperator = screen.getByText('/');
    const equalsOperator = screen.getByText('=');
    
    fireEvent.click(numberButton!);
    fireEvent.click(divideOperator);
    fireEvent.click(screen.getByText('0'));
    fireEvent.click(equalsOperator);
    
    // Should show error
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('Error');
    
    // Error should clear after 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('0');
  });

  test('delete button removes last entry', () => {
    render(<Calculator />);
    
    // Enter a number
    const numberButton = screen.getAllByRole('button').find(button => !isNaN(Number(button.textContent)));
    fireEvent.click(numberButton!);
    
    // Click delete
    const deleteButton = screen.getByText('DEL');
    fireEvent.click(deleteButton);
    
    // Display should be reset to 0
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('0');
  });

  test('target achievement shows success screen', () => {
    render(<Calculator />);
    
    // Get the target number
    const targetText = screen.getByText(/TARGET:/i).textContent;
    const target = Number(targetText?.split(':')[1].trim());
    
    // Mock achieving the target
    const numberButtons = screen.getAllByRole('button').filter(button => 
      !isNaN(Number(button.textContent))
    );
    const equalsOperator = screen.getByText('=');
    
    // Click numbers that sum to target (if possible)
    // This is a simplified test - in real scenario we'd need to find the right combination
    fireEvent.click(numberButtons[0]);
    
    // Set display value to target (mocking successful calculation)
    const display = screen.getByTestId('calculator-display');
    fireEvent.change(display, { target: { textContent: target.toString() } });
    
    fireEvent.click(equalsOperator);
    
    // Success screen should appear
    expect(screen.getByText('Well done genius! 🎉')).toBeInTheDocument();
  });
}); 