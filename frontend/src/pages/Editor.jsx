import { useParams, useNavigate } from 'react-router-dom';

const Editor = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <nav className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-slate-300 hover:text-white transition"
          >
            ← Back to Dashboard
          </button>
          <span className="text-slate-400">|</span>
          <h1 className="text-white font-medium">Editing Circuit: {id}</h1>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition">
          Save Circuit
        </button>
      </nav>

      <main className="flex-1 flex items-center justify-center text-slate-500">
        Workspace ready for React Flow integration.
      </main>
    </div>
  );
};

export default Editor;