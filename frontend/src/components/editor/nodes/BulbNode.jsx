import { Handle, Position } from 'reactflow';

const BulbNode = ({ data, selected }) => {
  const isActive = data?.value || false;

  return (
    <div className={`relative w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-300 shadow-lg
      ${isActive 
      ? 'bg-yellow-400 border-yellow-300 shadow-[0_0_30px_rgba(250,204,21,0.6)]' 
      : 'bg-slate-800 border-slate-600 shadow-slate-900/50'}
      ${selected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}`}
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
  );
};

export default BulbNode;