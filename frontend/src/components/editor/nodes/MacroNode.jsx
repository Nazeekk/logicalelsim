import { Handle, Position } from 'reactflow';

const MacroNode = ({ data, selected }) => {
  const circuit = data.circuit || { nodes: [] };
  const rotation = data?.rotation || 0;

  const sortByIndexOrY = (a, b) => {
    const labelA = a.data.label || '';
    const labelB = b.data.label || '';

    const matchA = labelA.match(/^(\d+):/);
    const matchB = labelB.match(/^(\d+):/);

    if (matchA && matchB) {
      return parseInt(matchA[1]) - parseInt(matchB[1]);
    }
    return a.position.y - b.position.y;
  };

  const inputs = circuit.nodes
    .filter((n) => n.type === 'switch')
    .sort(sortByIndexOrY);

  const outputs = circuit.nodes
    .filter((n) => n.type === 'bulb')
    .sort(sortByIndexOrY);

  const maxPins = Math.max(inputs.length, outputs.length);
  const minHeight = Math.max(80, maxPins * 35);

  return (
    <div
      className={`relative min-w-[140px] bg-slate-900 border-2 rounded-lg transition-all duration-200 shadow-xl
        ${selected ? 'border-blue-400 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'border-slate-700'}
      `}
      style={{ height: `${minHeight}px`, transform: `rotate(${rotation}deg)` }}
    >
      <div className="absolute top-1 w-full text-center px-2">
        <div className="text-slate-300 font-bold text-xs uppercase tracking-wider truncate">
          {data.name || 'IC'}
        </div>
      </div>

      <div className="flex justify-between w-full h-full pt-8 pb-4">
        <div className="flex flex-col justify-between h-full pl-2">
          {inputs.map((inputNode, index) => (
            <div key={`in-label-${index}`} className="flex items-center relative h-full">
              <Handle
                type="target"
                position={Position.Left}
                id={`in-${index}`}
                className="w-2 h-2 !bg-slate-300 !border-slate-600 !-left-[9px]"
                style={{ top: 'auto', bottom: 'auto' }}
              />
              <span className="text-[10px] font-mono font-bold text-slate-400 ml-1 truncate max-w-[40px]">
                {inputNode.data.label?.replace(/^\d+:/, '') || `A${index}`}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col justify-between h-full pr-2 text-right">
          {outputs.map((outputNode, index) => {
            const isActive = data.macroOutputs ? data.macroOutputs[`out-${index}`] : false;
            return (
              <div key={`out-label-${index}`} className="flex items-center justify-end relative h-full">
                <span className={`text-[10px] font-mono font-bold mr-1 truncate max-w-[40px] ${isActive ? 'text-yellow-400' : 'text-slate-400'}`}>
                  {outputNode.data.label?.replace(/^\d+:/, '') || `Q${index}`}
                </span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`out-${index}`}
                  className={`w-2 h-2 !-right-[9px] ${isActive ? '!bg-yellow-400 !border-yellow-200' : '!bg-slate-300 !border-slate-600'}`}
                  style={{ top: 'auto', bottom: 'auto' }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MacroNode;
