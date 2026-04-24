import { Handle, Position } from 'reactflow';
import { useCircuitStore } from '../../../store/circuitStore';
import { useMemo } from 'react';

const MacroNode = ({ data, selected }) => {
  const getCircuitTemplate = useCircuitStore((state) => state.getCircuitTemplate);

  const { inputs, outputs } = useMemo(() => {
    const template = getCircuitTemplate(data.templateId);
    if (!template?.data?.nodes) return { inputs: [], outputs: [] };

    const sortByIndexOrY = (a, b) => {
      const matchA = (a.data.label || '').match(/^(\d+):/);
      const matchB = (b.data.label || '').match(/^(\d+):/);
      if (matchA && matchB) return parseInt(matchA[1]) - parseInt(matchB[1]);
      return a.position.y - b.position.y;
    };

    return {
      inputs: template.data.nodes.filter((n) => n.type === 'switch').sort(sortByIndexOrY),
      outputs: template.data.nodes.filter((n) => n.type === 'bulb').sort(sortByIndexOrY),
    };
  }, [data.templateId, getCircuitTemplate]);

  const inCount = inputs.length > 0 ? inputs.length : (data.inputsCount || 0);
  const outCount = outputs.length > 0 ? outputs.length : (data.outputsCount || 0);

  const maxPins = Math.max(inCount, outCount);
  const minHeight = Math.max(80, maxPins * 35);

  return (
    <div
      className={`relative min-w-[140px] bg-slate-900 border-2 rounded-lg transition-all duration-200 shadow-xl
        ${selected ? 'border-blue-400 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'border-slate-700'}
      `}
      style={{ height: `${minHeight}px` }}
    >
      <div className="absolute top-1 w-full text-center px-2">
        <div className="text-slate-300 font-bold text-xs uppercase tracking-wider truncate">
          {data.name || 'IC'}
        </div>
      </div>

      <div className="flex justify-between w-full h-full pt-8 pb-4">
        <div className="flex flex-col justify-between h-full pl-2">
          {Array.from({ length: inCount }).map((_, index) => {
            const labelNode = inputs[index];
            const labelText = labelNode?.data?.label?.replace(/^\d+:/, '') || `A${index}`;
            return (
              <div key={`in-${index}`} className="flex items-center relative h-full">
                <Handle
                  type="target"
                  position={Position.Left}
                  id={`in-${index}`}
                  className="w-2 h-2 !bg-slate-300 !border-slate-600 !-left-[9px]"
                  style={{ top: 'auto', bottom: 'auto' }}
                />
                <span className="text-[10px] font-mono font-bold text-slate-400 ml-1 truncate max-w-[40px]">{labelText}</span>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col justify-between h-full pr-2 text-right">
          {Array.from({ length: outCount }).map((_, index) => {
            const labelNode = outputs[index];
            const labelText = labelNode?.data?.label?.replace(/^\d+:/, '') || `Q${index}`;
            const isActive = data.macroOutputs ? data.macroOutputs[`out-${index}`] : false;
            return (
              <div key={`out-${index}`} className="flex items-center justify-end relative h-full">
                <span className={`text-[10px] font-mono font-bold mr-1 truncate max-w-[40px] ${isActive ? 'text-yellow-400' : 'text-slate-400'}`}>
                  {labelText}
                </span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`out-${index}`}
                  className={`w-2 h-2 !-right-[9px]
                  ${isActive ? '!bg-yellow-400 !border-yellow-200' : '!bg-slate-300 !border-slate-600'}`}
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
