import { memo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Handle, Position } from 'reactflow';
import { useCircuitStore } from '../../../store/circuitStore';
import toast from 'react-hot-toast';

const DEFAULT_ISA = 'LDA 1 ARG\nADD 2 ARG\nSUB 3 ARG\nOUT 4\nSTA 5 ARG\nLDI 6 ARG\nJMP 7 ARG\nHLT 15';

const DataRomNode = ({ id, data, selected }) => {
  const updateNodeLabel = useCircuitStore((state) => state.updateNodeLabel);
  const updateNodeData = useCircuitStore((state) => state.updateNodeData);

  const [isIdeOpen, setIsIdeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('asm');

  const [archMode, setArchMode] = useState(data.archMode || 'multibyte');
  const [tempCode, setTempCode] = useState(data.label || '00 00');
  const [asmCode, setAsmCode] = useState(data.asmCode || '; Write ASM here\nLDI 10\nOUT\nHLT');
  const [isaText, setIsaText] = useState(data.isaText || DEFAULT_ISA);

  const compileAsm = () => {
    try {
      const isa = {};
      isaText.split('\n').forEach((line) => {
        const parts = line.trim().toUpperCase().split(/\s+/);
        if (parts.length >= 2) {
          isa[parts[0]] = { code: parseInt(parts[1]), hasArg: parts.includes('ARG') };
        }
      });

      const memory = new Array(256).fill(0);
      let addr = 0;
      let maxAddr = -1;

      const lines = asmCode.split('\n');
      for (let line of lines) {
        const cleanLine = line.split(';')[0].trim().toUpperCase();
        if (!cleanLine) continue;

        const parts = cleanLine.split(/\s+/);
        const cmd = parts[0];
        const arg = parts[1] ? parseInt(parts[1]) : 0;

        if (cmd === 'ORG') { addr = parseInt(parts[1]); continue; }
        if (cmd === 'DATA') {
          if (addr < 256) { memory[addr] = arg & 0xFF; maxAddr = Math.max(maxAddr, addr); addr++; }
          continue;
        }

        if (isa[cmd]) {
          const { code, hasArg } = isa[cmd];
          if (archMode === 'packed') {
            memory[addr] = ((code & 0xF) << 4) | (arg & 0xF);
          } else {
            memory[addr] = code & 0xFF;
            if (hasArg) {
              maxAddr = Math.max(maxAddr, addr);
              addr++;
              memory[addr] = arg & 0xFF;
            }
          }
          maxAddr = Math.max(maxAddr, addr);
          addr++;
        }
      }

      const cleanMemory = memory.slice(0, maxAddr + 1);
      const newHex = cleanMemory.length > 0
        ? cleanMemory.map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
        : '00';

      setTempCode(newHex);
      updateNodeLabel(id, newHex);
      updateNodeData(id, { asmCode, isaText, archMode, label: newHex });
      toast.success('Compiled Successfully!');
      setActiveTab('hex');
    } catch (e) { toast.error('Error: ' + e.message); }
  };

  const idePortal = isIdeOpen && createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-10" onKeyDown={(e) => e.stopPropagation()}>
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl h-[80vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
          <div className="flex gap-2">
            {['asm', 'hex', 'isa'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded text-[11px] font-bold transition ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="flex gap-4 items-center">
            <select value={archMode} onChange={(e) => setArchMode(e.target.value)} className="bg-slate-950 text-cyan-400 text-[10px] font-bold px-2 py-1 rounded border border-slate-600 outline-none">
              <option value="packed">MODE: PACKED (4+4)</option>
              <option value="multibyte">MODE: MULTI-BYTE (8+8)</option>
            </select>
            <button onClick={() => setIsIdeOpen(false)} className="text-slate-400 hover:text-white text-[11px] font-bold">CLOSE</button>
            <button onClick={compileAsm} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-1.5 rounded text-[11px] font-bold shadow-lg">COMPILE & FLASH</button>
          </div>
        </div>
        <div className="flex-1 flex overflow-hidden bg-slate-950">
          {activeTab === 'asm' &&
            <textarea
              className="w-full h-full bg-transparent p-6 text-blue-300 font-mono text-base outline-none resize-none leading-relaxed"
              value={asmCode}
              onChange={(e) => setAsmCode(e.target.value)}
            />
          }
          {activeTab === 'hex' &&
            <textarea
              className="w-full h-full bg-transparent p-6 text-amber-500 font-mono text-base outline-none resize-none tracking-widest"
              value={tempCode}
              onChange={(e) => setTempCode(e.target.value)}
            />
          }
          {activeTab === 'isa' && (
            <div className="p-6 w-full h-full flex flex-col gap-2">
              <span className="text-[10px] text-slate-500 uppercase">Format: NAME CODE [ARG]</span>
              <textarea
                className="flex-1 bg-transparent text-emerald-400 font-mono text-base outline-none resize-none border border-slate-800 p-4 rounded"
                value={isaText}
                onChange={(e) => setIsaText(e.target.value)} />
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );

  return (
    <div
      className={`relative bg-slate-900 border-2 rounded-lg p-3 w-56 shadow-2xl transition-all 
      ${selected ? 'border-blue-400 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'border-slate-700'}`}
    >
      <div className="flex justify-between items-center mb-2 px-1">
        <div className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Data ROM</div>
        <button onClick={(e) => { e.stopPropagation(); setIsIdeOpen(true); }} className="text-[9px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-0.5 rounded font-bold">IDE</button>
      </div>
      <textarea
        value={tempCode}
        onChange={(e) => setTempCode(e.target.value)} onBlur={() => updateNodeLabel(id, tempCode)} spellCheck="false"
        className="w-full h-24 bg-black text-blue-300 font-mono text-[10px] p-2 rounded border border-slate-800 outline-none resize-none custom-scrollbar"
      />

      <div className="flex justify-between mt-3 px-1">
        <div className="flex flex-col gap-1">
          <span className="text-[6px] text-slate-500 font-bold mb-1">ADDR IN</span>
          {[7,6,5,4,3,2,1,0].map((i) => (
            <div key={i} className="relative h-2.5 flex items-center">
              <Handle type="target" position={Position.Left} id={`A${i}`} className="!static !w-2 !h-2 !bg-slate-400 !border-0" />
              <span className="text-[6px] text-slate-600 ml-1 font-mono">A{i}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-1 items-end">
          <span className="text-[6px] text-slate-500 font-bold mb-1">DATA / END</span>
          {[7,6,5,4,3,2,1,0].map((i) => (
            <div key={i} className="relative h-2.5 flex items-center">
              <span className={`text-[6px] mr-1 font-mono ${data.macroOutputs?.[`out-${i}`] ? 'text-yellow-400' : 'text-slate-600'}`}>Q{i}</span>
              <Handle type="source" position={Position.Right} id={`out-${i}`} className={`!static !w-2 !h-2 !border-0 ${data.macroOutputs?.[`out-${i}`] ? '!bg-yellow-400' : '!bg-slate-600'}`} />
            </div>
          ))}
          <div className="relative h-3 mt-1 flex items-center">
            <span className={`text-[6px] mr-1 font-bold ${data.macroOutputs?.['end'] ? 'text-red-400' : 'text-slate-600'}`}>STOP</span>
            <Handle
              type="source"
              position={Position.Right}
              id="end"
              className={`!static !w-2.5 !h-2.5 !border-0 ${data.macroOutputs?.['end'] ? '!bg-red-500 shadow-[0_0_5px_#ef4444]' : '!bg-slate-700'}`}
            />
          </div>
        </div>
      </div>
      {idePortal}
    </div>
  );
};

export default memo(DataRomNode);
