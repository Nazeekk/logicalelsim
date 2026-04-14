import { Handle, Position } from 'reactflow';
import { useCircuitStore } from '../../../store/circuitStore';

const SwitchNode = ({ id, data, selected }) => {
  const toggleNodeValue = useCircuitStore((state) => state.toggleNodeValue);

  const isActive = data?.value || false;

  return (
    <div className={`relative w-16 h-16 rounded-xl border-2 flex items-center justify-center cursor-pointer transition-all duration-200 shadow-lg
      ${isActive 
      ? 'bg-emerald-500 border-emerald-400 shadow-emerald-500/30' 
      : 'bg-slate-700 border-slate-600 shadow-slate-900/50'
    }
      ${selected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}`}
    onClick={() => toggleNodeValue(id)}
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
  );
};

export default SwitchNode;