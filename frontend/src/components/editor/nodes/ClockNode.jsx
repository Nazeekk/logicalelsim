import { Handle, Position } from 'reactflow';
import { useCircuitStore } from '../../../store/circuitStore';
import { useEffect, useState } from 'react';

const ClockNode = ({ id, data, selected }) => {
  const tickClock = useCircuitStore((state) => state.tickClock);

  // Локальні стани компонента
  const isActive = data?.value || false;
  const [frequency, setFrequency] = useState(data?.frequency || 1);
  const [isRunning, setIsRunning] = useState(true);

  // Головний цикл годинника
  useEffect(() => {
    if (!isRunning || !tickClock) return;

    const halfPeriod = 1000 / (frequency * 2);
    let currentValue = isActive;

    const intervalId = setInterval(() => {
      currentValue = !currentValue;
      tickClock(id, currentValue);
    }, halfPeriod);

    return () => clearInterval(intervalId);
  }, [isRunning, frequency, id, tickClock, isActive]);

  const handleFreqChange = (e) => {
    let val = parseFloat(e.target.value);
    if (isNaN(val) || val < 0.1) val = 0.1;
    if (val > 50) val = 50;
    setFrequency(val);
  };

  return (
    <div
      className={`relative flex flex-col items-center bg-slate-900 border-2 rounded-lg p-2 w-24 transition-all duration-200 shadow-xl
        ${isActive ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'border-slate-700'}
        ${selected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}
      `}
      style={{ transform: `rotate(${data?.rotation || 0}deg)` }}
    >
      <div className="flex justify-between items-center w-full mb-2 px-1">
        <span className={`text-[10px] font-bold ${isActive ? 'text-cyan-400' : 'text-slate-400'}`}>CLOCK</span>
        <div className={`w-2 h-2 rounded-full transition-colors ${isActive ? 'bg-cyan-400' : 'bg-slate-700'}`}></div>
      </div>

      <div className="flex items-center gap-1 w-full justify-center bg-slate-800 p-1 rounded">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`p-1 rounded hover:bg-slate-700 transition ${isRunning ? 'text-red-400' : 'text-green-400'}`}
          title={isRunning ? 'Pause Clock' : 'Start Clock'}
        >
          {isRunning ? (
            <svg
              className="w-3 h-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          ) : (
            <svg
              className="w-3 h-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
          )}
        </button>

        <input
          type="number"
          value={frequency}
          onChange={handleFreqChange}
          className="w-8 h-4 bg-transparent text-white text-[10px] text-center outline-none border-b border-slate-600 focus:border-cyan-400 custom-number-input"
          step="1" min="0.1" max="50"
        />
        <span className="text-[8px] text-slate-500">Hz</span>
      </div>

      {/* Вихід */}
      <Handle
        type="source"
        position={Position.Right}
        className={`w-2.5 h-2.5 !border-2 !-right-[6px] ${isActive ? '!bg-cyan-400 !border-cyan-200' : '!bg-slate-300 !border-slate-600'}`}
      />
    </div>
  );
};

export default ClockNode;
