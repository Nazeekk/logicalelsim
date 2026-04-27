import { Handle, Position } from 'reactflow';
import { memo } from 'react';

const NOTNode = ({ data, selected }) => {
  const isActive = data?.value || false;
  const rotation = data?.rotation || 0;

  return (
    <div
      className={`relative w-0 h-0 flex items-center justify-center transition-all duration-200
            ${selected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}`}
      style={{
        borderTop: '25px solid transparent',
        borderBottom: '25px solid transparent',
        borderLeft: `45px solid ${isActive ? '#f43f5e' : '#475569'}`,
        transform: `rotate(${rotation}deg)`,
      }}
    >
      <div className={`absolute -right-[10px] top-[-5px] w-[10px] h-[10px] rounded-full border-2 bg-slate-800 transition-all duration-200
        ${isActive ? 'border-rose-400' : 'border-slate-600'}`}>
      </div>

      <span className={`absolute -left-[35px] font-bold text-[10px] select-none ${isActive ? 'text-white' : 'text-slate-300'}`}>
        NOT
      </span>

      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 !bg-slate-300 !border-2 !border-slate-600 !-left-[45px]" />
      <Handle type="source" position={Position.Right} className={`w-3 h-3 !bg-slate-300 !border-2 !-right-[15px] ${isActive ? '!border-rose-400' : '!border-slate-600'}`} />
    </div>
  );
};

export default memo(NOTNode);
