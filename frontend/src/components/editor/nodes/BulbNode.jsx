import { useCircuitStore } from '@/store/circuitStore';
import { useState } from 'react';
import { Handle, Position } from 'reactflow';

const BulbNode = ({ id, data, selected }) => {
  const updateNodeLabel = useCircuitStore((state) => state.updateNodeLabel);

  const isActive = data?.value || false;
  const rotation = data?.rotation || 0;
  const label = data?.label || '';
  const [isEditing, setIsEditing] = useState(false);
  const [tempLabel, setTempLabel] = useState(label);

  const handleLabelSubmit = () => {
    setIsEditing(false);
    if (tempLabel !== label) {
      updateNodeLabel(id, tempLabel);
    }
  };

  return (
    <div className="relative flex flex-col items-center gap-1">
      <div className={`relative w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-300 shadow-lg
      ${isActive 
      ? 'bg-yellow-400 border-yellow-300 shadow-[0_0_30px_rgba(250,204,21,0.6)]' 
      : 'bg-slate-800 border-slate-600 shadow-slate-900/50'}
      ${selected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}`}
      style={{ transform: `rotate(${data?.rotation || 0}deg)` }}
      >
        <svg 
          className={`w-8 h-8 ${isActive ? 'text-white' : 'text-slate-600'}`} 
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" />
          <path d="M9 21h6v1a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-1z" />
        </svg>

        <Handle 
          type="target" 
          position={Position.Left} 
          className={`w-3 h-3 !bg-slate-300 !border-2 ${isActive ? '!border-yellow-400' : '!border-slate-600'}`} 
        />
      </div>
      {isEditing ? (
        <input
          autoFocus
          value={tempLabel}
          onChange={(e) => setTempLabel(e.target.value)}
          onBlur={handleLabelSubmit}
          onKeyDown={(e) => e.key === 'Enter' && handleLabelSubmit()}
          className="w-16 h-4 text-[9px] text-center bg-slate-800 text-white border border-blue-500 rounded outline-none"
        />
      ) : (
        <div 
          onDoubleClick={() => setIsEditing(true)}
          className="text-[10px] font-bold text-slate-300 min-h-[14px] cursor-text px-1 hover:bg-slate-800 rounded truncate max-w-[60px]"
          title="Double click to rename"
        >
          {label || 'OUT'}
        </div>
      )}
    </div>
  );
};

export default BulbNode;