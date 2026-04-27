import { memo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Handle, Position } from 'reactflow';
import { useCircuitStore } from '../../../store/circuitStore';

const LoggerNode = ({ id, data, selected }) => {
  const updateNodeData = useCircuitStore((state) => state.updateNodeData);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const logs = data.macroOutputs?.logs || [];
  const signalNames = data.signalNames || ['Signal_0', 'Signal_1', 'Signal_2', 'Signal_3'];
  const [tempNames, setTempNames] = useState(signalNames.join('\n'));

  const handleSaveSettings = () => {
    const newNames = tempNames.split('\n').map((n) => n.trim()).filter((n) => n !== '');
    if (newNames.length === 0) newNames.push('Signal_0');
    updateNodeData(id, { signalNames: newNames });
    setIsSettingsOpen(false);
  };

  const clearLogs = () => {
    updateNodeData(id, { macroOutputs: { logs: [] } });
  };

  return (
    <div className={`relative bg-slate-900 border-2 rounded-lg p-3 w-48 shadow-2xl transition-all
      ${selected ? 'border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.3)]' : 'border-slate-700'}`}>

      <div
        className="text-[10px] text-fuchsia-400 font-bold mb-2 text-center uppercase tracking-widest cursor-pointer hover:bg-slate-800 rounded"
        onDoubleClick={(e) => { e.stopPropagation(); setIsSettingsOpen(true); }}
        title="Double-click to set signal names"
      >
        Logic Analyzer
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); setIsLogOpen(true); }}
          className="w-full py-1.5 bg-fuchsia-900/30 hover:bg-fuchsia-900/50 text-fuchsia-300 text-[9px] font-bold rounded border border-fuchsia-900/50 transition-colors"
        >
          VIEW LOGS ({logs.length})
        </button>

        <div className="relative h-4 flex items-center bg-slate-800 rounded px-1 mb-1 border border-slate-700">
          <Handle type="target" position={Position.Left} id="clk" className="!w-2 !h-2 !bg-yellow-400 !border-yellow-200" />
          <span className="text-[7px] text-yellow-400 ml-1 font-bold">TRIGGER (CLK)</span>
        </div>

        <div className="flex flex-col gap-1">
          {signalNames.map((name, i) => {
            const isActive = logs.length > 0 && logs[0].signals[`in-${i}`];
            return (
              <div key={i} className="relative h-3 flex items-center">
                <Handle type="target" position={Position.Left} id={`in-${i}`} className={`!static !w-2 !h-2 !border-0 ${isActive ? '!bg-fuchsia-400 shadow-[0_0_5px_#e879f9]' : '!bg-slate-500'}`} />
                <span className={`text-[7px] ml-1 font-mono truncate max-w-[150px] ${isActive ? 'text-fuchsia-300' : 'text-slate-500'}`}>
                  {name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {isSettingsOpen && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm" onKeyDown={(e) => e.stopPropagation()}>
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 w-80 shadow-2xl">
            <h3 className="text-white text-sm font-bold mb-2">Configure Input Signals</h3>
            <p className="text-slate-400 text-xs mb-4">Enter signal names (one per line). This will create corresponding input pins.</p>
            <textarea
              className="w-full h-40 bg-slate-950 text-fuchsia-400 font-mono text-sm p-3 rounded border border-slate-800 outline-none"
              value={tempNames}
              onChange={(e) => setTempNames(e.target.value)}
              placeholder="REGA_LOAD&#10;MAR_IN&#10;PC_INC"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 text-xs font-bold px-3">CANCEL</button>
              <button onClick={handleSaveSettings} className="bg-fuchsia-600 text-white px-4 py-2 rounded text-xs font-bold">SAVE</button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {isLogOpen && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-10" onKeyDown={(e) => e.stopPropagation()}>
          <div className="bg-slate-900 border border-slate-700 w-full max-w-6xl h-[80vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-fuchsia-400 font-bold text-sm tracking-widest uppercase">System Logic Analyzer</h3>
              <div className="flex gap-4">
                <button onClick={clearLogs} className="text-red-400 text-xs font-bold px-4 py-1 border border-red-900/50 rounded hover:bg-red-900/30">CLEAR LOGS</button>
                <button onClick={() => setIsLogOpen(false)} className="bg-slate-700 text-white px-6 py-1.5 rounded text-xs font-bold">CLOSE</button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-slate-950 p-4 custom-scrollbar">
              {logs.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-slate-600 font-mono">No data. Connect CLK and run simulation.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-slate-900 shadow-md">
                    <tr>
                      <th className="p-2 text-[10px] text-slate-500 border-b border-slate-700 w-16">STEP</th>
                      <th className="p-2 text-[10px] text-slate-500 border-b border-slate-700 w-24">TIME</th>
                      {signalNames.map((name, i) => (
                        <th key={i} className="p-2 text-[10px] text-fuchsia-500/70 border-b border-slate-700 text-center font-mono truncate max-w-[80px]" title={name}>
                          {name}
                        </th>
                    ))}
                    </tr>
                  </thead>
                  <tbody className="font-mono text-[11px]">
                    {logs.map((log, i) => (
                      <tr key={i} className="hover:bg-white/5 border-b border-slate-800/50 transition-colors">
                        <td className="p-2 text-slate-500 border-r border-slate-800/50">{log.step}</td>
                        <td className="p-2 text-slate-600 border-r border-slate-800/50">{log.time}</td>
                        {signalNames.map((_, idx) => {
                        const val = log.signals[`in-${idx}`];
                        return (
                          <td key={idx} className={`p-2 border-r border-slate-800/50 text-center font-bold ${val ? 'text-emerald-400 bg-emerald-900/10' : 'text-slate-700'}`}>
                            {val ? '1' : '0'}
                          </td>
                        );
                      })}
                      </tr>
                  ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};

export default memo(LoggerNode);
