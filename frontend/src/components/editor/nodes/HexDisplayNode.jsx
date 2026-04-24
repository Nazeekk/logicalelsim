import { Handle, Position } from 'reactflow';

const Segment = ({ id, className, activeSegments }) => {
  const isOn = activeSegments.includes(id);
  return (
    <div
      className={`absolute rounded-full transition-colors duration-75 ${className} 
        ${isOn ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-red-950/40'}`}
    />
  );
};

const HexDisplayNode = ({ data, selected }) => {
  const bit0 = data?.inputs?.['in-0'] ? 1 : 0;
  const bit1 = data?.inputs?.['in-1'] ? 2 : 0;
  const bit2 = data?.inputs?.['in-2'] ? 4 : 0;
  const bit3 = data?.inputs?.['in-3'] ? 8 : 0;

  const value = bit0 + bit1 + bit2 + bit3;

  const hexChar = value.toString(16).toUpperCase();

  const segments = {
    '0': ['a', 'b', 'c', 'd', 'e', 'f'],
    '1': ['b', 'c'],
    '2': ['a', 'b', 'd', 'e', 'g'],
    '3': ['a', 'b', 'c', 'd', 'g'],
    '4': ['b', 'c', 'f', 'g'],
    '5': ['a', 'c', 'd', 'f', 'g'],
    '6': ['a', 'c', 'd', 'e', 'f', 'g'],
    '7': ['a', 'b', 'c'],
    '8': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
    '9': ['a', 'b', 'c', 'd', 'f', 'g'],
    'A': ['a', 'b', 'c', 'e', 'f', 'g'],
    'B': ['c', 'd', 'e', 'f', 'g'],
    'C': ['a', 'd', 'e', 'f'],
    'D': ['b', 'c', 'd', 'e', 'g'],
    'E': ['a', 'd', 'e', 'f', 'g'],
    'F': ['a', 'e', 'f', 'g'],
  };

  const activeSegments = segments[hexChar] || [];

  return (
    <div className={`relative flex items-center bg-slate-900 border-2 rounded-lg p-3 transition-all duration-200 shadow-xl
      ${selected ? 'border-blue-400 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'border-slate-700'}`}
      style={{ transform: `rotate(${data?.rotation || 0}deg)` }}
    >
      <div className="flex flex-col justify-between h-[80px] mr-6">
        <div
          className="relative flex items-center h-full"
        >
          <Handle
            type="target"
            position={Position.Left}
            id="in-3"
            className="w-2 h-2 !bg-slate-300"
            style={{ top: 'auto', bottom: 'auto' }}
          />
          <span className="text-[8px] text-slate-500 ml-1">8</span>
        </div>
        <div
          className="relative flex items-center h-full"
        >
          <Handle
            type="target"
            position={Position.Left}
            id="in-2"
            className="w-2 h-2 !bg-slate-300"
            style={{ top: 'auto', bottom: 'auto' }}
          />
          <span className="text-[8px] text-slate-500 ml-1">4</span>
        </div>
        <div
          className="relative flex items-center h-full"
        >
          <Handle
            type="target"
            position={Position.Left}
            id="in-1"
            className="w-2 h-2 !bg-slate-300"
            style={{ top: 'auto', bottom: 'auto' }}
          />
          <span className="text-[8px] text-slate-500 ml-1">2</span>
        </div>
        <div
          className="relative flex items-center h-full"
        >
          <Handle
            type="target"
            position={Position.Left}
            id="in-0"
            className="w-2 h-2 !bg-slate-300"
            style={{ top: 'auto', bottom: 'auto' }}
          />
          <span className="text-[8px] text-slate-500 ml-1">1</span>
        </div>
      </div>

      <div className="relative w-10 h-[72px] bg-black rounded p-1 border border-slate-800 shadow-inner overflow-hidden">
        <Segment id="a" className="w-6 h-1.5 top-1 left-2" activeSegments={activeSegments} />
        <Segment id="b" className="w-1.5 h-7 top-2 right-1" activeSegments={activeSegments} />
        <Segment id="c" className="w-1.5 h-7 bottom-2 right-1" activeSegments={activeSegments} />
        <Segment id="d" className="w-6 h-1.5 bottom-1 left-2" activeSegments={activeSegments} />
        <Segment id="e" className="w-1.5 h-7 bottom-2 left-1" activeSegments={activeSegments} />
        <Segment id="f" className="w-1.5 h-7 top-2 left-1" activeSegments={activeSegments} />
        <Segment id="g" className="w-6 h-1.5 top-[33px] left-2" activeSegments={activeSegments} />
      </div>
    </div>
  );
};

export default HexDisplayNode;
