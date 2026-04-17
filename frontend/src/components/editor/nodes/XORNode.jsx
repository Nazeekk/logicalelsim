import { Handle, Position } from 'reactflow';

const XORNode = ({ data, selected }) => {
  const isActive = data?.value || false;
  const rotation = data?.rotation || 0;

  return (
    <div className="relative flex items-center" style={{ transform: `rotate(${rotation}deg)` }}>
      <div className={`absolute -left-[6px] w-[15px] h-[60px] border-l-2 rounded-[50%] 
        ${isActive ? 'border-orange-400' : 'border-slate-600'}`}></div>

      <div className={`relative w-20 h-16 border-2 flex items-center justify-center transition-all duration-200 bg-slate-800 shadow-lg
        ${isActive ? 'border-orange-400 shadow-[0_0_15px_rgba(251,146,60,0.4)]' : 'border-slate-600'}
        ${selected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}`}
        style={{
        borderLeftRadius: '20px',
        borderTopRightRadius: '30px',
        borderBottomRightRadius: '30px',
      }}
      >
        <span className={`font-bold text-sm select-none ml-2 ${isActive ? 'text-orange-400' : 'text-slate-400'}`}>XOR</span>

        <Handle type="target" position={Position.Left} id="a" style={{ top: '25%' }} className="w-2.5 h-2.5 !bg-slate-300 !-left-[10px]" />
        <Handle type="target" position={Position.Left} id="b" style={{ top: '75%' }} className="w-2.5 h-2.5 !bg-slate-300 !-left-[10px]" />
        <Handle type="source" position={Position.Right} className={`w-3 h-3 !bg-slate-300 ${isActive ? '!border-orange-400' : '!border-slate-600'}`} />
      </div>
    </div>
  );
};
export default XORNode;
