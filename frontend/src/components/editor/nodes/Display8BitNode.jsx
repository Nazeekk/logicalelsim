import { memo } from 'react';
import { Handle, Position } from 'reactflow';

const Display8BitNode = ({ data, selected }) => {
  const value = typeof data?.value === 'number' ? data.value : 0;

  const hexValue = value.toString(16).padStart(2, '0').toUpperCase();
  const binValue = value.toString(2).padStart(8, '0');
  const decValue = value.toString(10);

  return (
    <div className={`relative bg-slate-950 border-2 rounded-xl p-4 min-w-[160px] shadow-2xl transition-all duration-300
      ${selected ? 'border-cyan-500 shadow-cyan-500/20' : 'border-slate-800'}`}>

      <div className="text-[9px] font-black text-slate-500 mb-3 uppercase tracking-[0.2em] text-center border-b border-slate-800 pb-2">
        8-Bit Output Terminal
      </div>

      <div className="flex gap-4">
        <div className="flex flex-col justify-between py-1 gap-1.5">
          {[7, 6, 5, 4, 3, 2, 1, 0].map((bit) => (
            <div key={bit} className="relative flex items-center h-3">
              <Handle
                type="target"
                position={Position.Left}
                id={`in-${bit}`}
                className="!w-2 !h-2 !bg-slate-700 !border-slate-600 !-left-[21px]"
              />
              <span className="text-[7px] font-mono text-slate-600">D{bit}</span>
            </div>
          ))}
        </div>

        <div className="flex-1 bg-black/50 rounded-lg p-3 border border-slate-800 flex flex-col items-center justify-center gap-2">
          <div className="text-3xl font-mono font-bold text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]">
            {decValue}
          </div>

          <div className="w-full h-px bg-slate-800/50"></div>

          <div className="flex justify-between w-full px-1">
            <div className="flex flex-col">
              <span className="text-[6px] text-slate-600 uppercase">Hex</span>
              <span className="text-[10px] font-mono text-amber-500">0x{hexValue}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[6px] text-slate-600 uppercase">Binary</span>
              <span className="text-[9px] font-mono text-emerald-500">{binValue}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-4 px-2">
        {binValue.split('').map((bit, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-150 
              ${bit === '1' ? 'bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.8)]' : 'bg-slate-900'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default memo(Display8BitNode);
