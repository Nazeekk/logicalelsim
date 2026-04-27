import { Handle, Position } from 'reactflow';
import { useCircuitStore } from '../../../store/circuitStore';
import { useState, memo } from 'react';

const SwitchNode = ({ id, data, selected }) => {
  const toggleNodeValue = useCircuitStore((state) => state.toggleNodeValue);
  const updateNodeLabel = useCircuitStore((state) => state.updateNodeLabel);

  const isActive = data?.value || false;
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
          {label || 'IN'}
        </div>
      )}
      <div className={`relative w-16 h-16 rounded-xl border-2 flex items-center justify-center cursor-pointer transition-all duration-200 shadow-lg
      ${isActive
      ? 'bg-emerald-500 border-emerald-400 shadow-emerald-500/30'
      : 'bg-slate-700 border-slate-600 shadow-slate-900/50'
    }
      ${selected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}`}
        onClick={() => toggleNodeValue(id)}
        style={{ transform: `rotate(${data?.rotation || 0}deg)` }}
      >
        <span className="text-white font-bold text-xs pointer-events-none select-none">
          {isActive ? 'ON' : 'OFF'}
        </span>

        <Handle
          type="source"
          position={Position.Right}
          className={`w-3 h-3 !bg-slate-300 !border-2 ${isActive ? '!border-emerald-400' : '!border-slate-600'}`}
        />
      </div>
    </div>
  );
};

export default memo(SwitchNode);
