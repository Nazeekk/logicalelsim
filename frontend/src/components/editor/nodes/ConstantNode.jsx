import { Handle, Position } from 'reactflow';
import { useCircuitStore } from '../../../store/circuitStore';
import { memo } from 'react';

const ConstantNode = ({ id, data, selected }) => {
  const toggleNodeValue = useCircuitStore((state) => state.toggleNodeValue);

  const isHigh = data?.value !== undefined ? data.value : true;

  return (
    <div className={`relative flex flex-col items-center justify-center w-10 h-10 border-2 rounded transition-all duration-200 shadow-md cursor-pointer
      ${isHigh ? 'bg-red-900 border-red-500 shadow-red-500/20' : 'bg-slate-900 border-slate-500 shadow-slate-500/20'}
      ${selected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}`}
      onClick={() => toggleNodeValue(id)}
      style={{ transform: `rotate(${data?.rotation || 0}deg)` }}
    >
      <span className={`font-mono font-bold text-xs select-none ${isHigh ? 'text-red-400' : 'text-slate-400'}`}>
        {isHigh ? '1' : '0'}
      </span>
      <span className="text-[6px] text-slate-500 select-none -mt-1">
        {isHigh ? 'VCC' : 'GND'}
      </span>

      <Handle
        type="source"
        position={Position.Right}
        className={`w-2.5 h-2.5 !border-2 !-right-[6px] ${isHigh ? '!bg-red-400 !border-red-200' : '!bg-slate-400 !border-slate-200'}`}
      />
    </div>
  );
};

export default memo(ConstantNode);
