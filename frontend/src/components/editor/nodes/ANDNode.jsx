import { Handle, Position } from 'reactflow';

const ANDNode = ({ data, selected }) => {
  const isActive = data?.value || false;
  const rotation = data?.rotation || 0;

  return (
    <div className={`relative w-20 h-16 rounded-r-full rounded-l-md border-2 flex items-center justify-center transition-all duration-200 bg-slate-800 shadow-lg
      ${isActive ? 'border-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.4)]' : 'border-slate-600'}
      ${selected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}`}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <span className={`font-bold text-sm select-none ${isActive ? 'text-blue-400' : 'text-slate-400'}`}>
        AND
      </span>

      <Handle
        type="target"
        position={Position.Left}
        id="a"
        style={{ top: '25%' }}
        className="w-2.5 h-2.5 !bg-slate-300 !border-2 !border-slate-600"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="b"
        style={{ top: '75%' }}
        className="w-2.5 h-2.5 !bg-slate-300 !border-2 !border-slate-600"
      />

      <Handle
        type="source"
        position={Position.Right}
        className={`w-3 h-3 !bg-slate-300 !border-2 ${isActive ? '!border-blue-400' : '!border-slate-600'}`}
      />
    </div>
  );
};

export default ANDNode;
