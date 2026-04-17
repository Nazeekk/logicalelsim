import { Handle, Position } from 'reactflow';

const XNORNode = ({ data, selected }) => {
  const isActive = data?.value || false;
  const rotation = data?.rotation || 0;

  return (
    <div className="relative flex items-center" style={{ transform: `rotate(${rotation}deg)` }}>
      <div className={`absolute -left-[6px] w-[15px] h-[60px] border-l-2 rounded-[50%] ${isActive ? 'border-teal-400' : 'border-slate-600'}`}></div>

      <div className={`relative w-20 h-16 border-2 flex items-center justify-center transition-all duration-200 bg-slate-800 shadow-lg
        ${isActive ? 'border-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.4)]' : 'border-slate-600'}
        ${selected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}`}
        style={{
        borderLeftRadius: '20px',
        borderTopRightRadius: '30px',
        borderBottomRightRadius: '30px',
      }}
      >
        <span className={`font-bold text-xs select-none ml-1 ${isActive ? 'text-teal-400' : 'text-slate-400'}`}>XNOR</span>

        <div className={`absolute -right-[6px] w-[10px] h-[10px] rounded-full border-2 bg-slate-800 ${isActive ? 'border-teal-400' : 'border-slate-600'}`}></div>

        <Handle type="target" position={Position.Left} id="a" style={{ top: '25%' }} className="w-2.5 h-2.5 !bg-slate-300 !-left-[10px]" />
        <Handle type="target" position={Position.Left} id="b" style={{ top: '75%' }} className="w-2.5 h-2.5 !bg-slate-300 !-left-[10px]" />
        <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 !bg-slate-300 !-right-[12px]" />
      </div>
    </div>
  );
};
export default XNORNode;
