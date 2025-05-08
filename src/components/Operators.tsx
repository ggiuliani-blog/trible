interface OperatorsProps {
  onOperatorClick: (operator: string) => void;
  onDelete: () => void;
}

export const Operators = ({ onOperatorClick, onDelete }: OperatorsProps) => {
  const buttonBaseClass = "w-full rounded-lg text-white font-semibold transition-all duration-200 active:scale-95";
  const operatorButtonClass = `${buttonBaseClass} h-10 text-base bg-orange-500 hover:bg-orange-600`;
  const deleteButtonClass = `${buttonBaseClass} h-10 text-base bg-red-500 hover:bg-red-600`;

  return (
    <div className="grid grid-cols-3 gap-3">
      <button onClick={() => onOperatorClick('(')} className={operatorButtonClass}>(</button>
      <button onClick={() => onOperatorClick(')')} className={operatorButtonClass}>)</button>
      <button onClick={onDelete} className={deleteButtonClass}>DEL</button>
      <button onClick={() => onOperatorClick('+')} className={operatorButtonClass}>+</button>
      <button onClick={() => onOperatorClick('-')} className={operatorButtonClass}>-</button>
      <button onClick={() => onOperatorClick('=')} className={`${operatorButtonClass} font-bold`}>=</button>
      <button onClick={() => onOperatorClick('/')} className={operatorButtonClass}>/</button>
      <button onClick={() => onOperatorClick('*')} className={operatorButtonClass}>*</button>
    </div>
  );
}; 