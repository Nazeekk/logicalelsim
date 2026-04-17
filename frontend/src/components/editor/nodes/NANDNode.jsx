import { Handle, Position } from 'reactflow';

const NANDNode = ({ data, selected }) => {
  const isActive = data?.value || false;
  const rotation = data?.rotation || 0;

  return (
    <div className={`relative w-20 h-16 rounded-r-full rounded-l-md border-2 flex items-center justify-center transition-all duration-200 bg-slate-800 shadow-lg
      ${isActive ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'border-slate-600'}
      ${selected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}`}
    style={{ transform: `rotate(${rotation}deg)` }}
    >
      <span className={`font-bold text-sm select-none mr-2 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`}>NAND</span>
      
      <div className={`absolute -right-[6px] w-[10px] h-[10px] rounded-full border-2 bg-slate-800 
        ${isActive ? 'border-cyan-400' : 'border-slate-600'}`}></div>

      <Handle type="target" position={Position.Left} id="a" style={{ top: '25%' }} className="w-2.5 h-2.5 !bg-slate-300" />
      <Handle type="target" position={Position.Left} id="b" style={{ top: '75%' }} className="w-2.5 h-2.5 !bg-slate-300" />
      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 !bg-slate-300 !-right-[12px]" />
    </div>
  );
};
export default NANDNode;