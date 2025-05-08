import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Calculator from './Calculator';

describe('Calculator Component', () => {
  it('renders calculator with initial state', () => {
    render(<Calculator />);
    
    // Check if target number is displayed
    expect(screen.getByText(/TARGET: 75/)).toBeInTheDocument();
    
    // Check if display shows initial value
    const displayElement = screen.getByText('0');
    expect(displayElement).toBeInTheDocument();
    
    // Check if all number buttons are present and enabled
    const numbers = [1, 2, 3, 10, 25, 50];
    numbers.forEach(num => {
      const button = screen.getByRole('button', { name: num.toString() });
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });
  });

  it('allows clicking numbers and operators', () => {
    render(<Calculator />);
    
    // Click number 25
    const button25 = screen.getByRole('button', { name: '25' });
    fireEvent.click(button25);
    
    // Find the display element
    const display = screen.getByTestId('calculator-display');
    expect(display).toHaveTextContent('25');
    
    // Click plus operator
    const plusButton = screen.getByRole('button', { name: '+' });
    fireEvent.click(plusButton);
    
    // Check updated display
    expect(display).toHaveTextContent('25 +');
    
    // Click number 50
    const button50 = screen.getByRole('button', { name: '50' });
    fireEvent.click(button50);
    
    // Check final expression
    expect(display).toHaveTextContent('25 + 50');
  });

  it('disables used numbers', () => {
    render(<Calculator />);
    
    // Click number 25
    const button25 = screen.getByRole('button', { name: '25' });
    fireEvent.click(button25);
    
    // Click plus to complete the input
    const plusButton = screen.getByRole('button', { name: '+' });
    fireEvent.click(plusButton);
    
    // The button should now be disabled
    expect(button25).toBeDisabled();
  });

  it('shows success message when target is reached', () => {
    render(<Calculator />);
    
    // Create a calculation that equals 75 (target)
    const button25 = screen.getByRole('button', { name: '25' });
    const button50 = screen.getByRole('button', { name: '50' });
    const plusButton = screen.getByRole('button', { name: '+' });
    const equalsButton = screen.getByRole('button', { name: '=' });
    
    fireEvent.click(button25);
    fireEvent.click(plusButton);
    fireEvent.click(button50);
    fireEvent.click(equalsButton);
    
    // Check if success message appears
    const successMessage = screen.getByText('Well done genius! 🎉');
    expect(successMessage).toBeInTheDocument();
  });

  it('allows removing last calculation', () => {
    render(<Calculator />);
    
    // Make a calculation
    const button25 = screen.getByRole('button', { name: '25' });
    const button50 = screen.getByRole('button', { name: '50' });
    const plusButton = screen.getByRole('button', { name: '+' });
    const equalsButton = screen.getByRole('button', { name: '=' });
    
    fireEvent.click(button25);
    fireEvent.click(plusButton);
    fireEvent.click(button50);
    fireEvent.click(equalsButton);
    
    // Find and click the remove button
    const removeButton = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(removeButton);
    
    // Check if the numbers are enabled again
    expect(button25).not.toBeDisabled();
    expect(button50).not.toBeDisabled();
  });
}); 