import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCircuitStore } from '../store/circuitStore';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const { circuits, isLoading, fetchCircuits, createCircuit, deleteCircuit, duplicateCircuit } = useCircuitStore();
  const navigate = useNavigate();

  const [newCircuitName, setNewCircuitName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchCircuits();
  }, [fetchCircuits]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newCircuitName.trim()) return;

    const newCircuit = await createCircuit(newCircuitName);
    if (newCircuit) {
      setNewCircuitName('');
      setIsCreating(false);
      navigate(`/editor/${newCircuit._id}`);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">LogicSim</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            {user?.email}
          </span>
          <button
            onClick={handleLogout}
            className="text-sm text-slate-500 hover:text-red-600 transition font-medium"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800">My Circuits</h2>

            {!isCreating ? (
              <button
                onClick={() => setIsCreating(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition shadow-sm"
              >
                + New Circuit
              </button>
            ) : (
              <form onSubmit={handleCreate} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Circuit name..."
                  value={newCircuitName}
                  onChange={(e) => setNewCircuitName(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-10 text-slate-500">Loading circuits...</div>
          ) : circuits.length === 0 ? (
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 flex flex-col items-center justify-center text-slate-500 bg-white">
              <p className="text-lg font-medium mb-2">No circuits found</p>
              <p className="text-sm">Click &quot;New Circuit&quot; to start building logic gates.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {circuits.map((circuit) => (
                <div
                  key={circuit._id}
                  className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-slate-800 truncate pr-4">
                      {circuit.name}
                    </h3>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateCircuit(circuit._id);
                        }}
                        className="text-slate-400 hover:text-blue-500 transition"
                        title="Duplicate (Create Copy)"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                        e.stopPropagation();
                        if(window.confirm('Are you sure you want to delete this circuit?')) {
                          deleteCircuit(circuit._id);
                        }
                      }}
                        className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                        title="Delete"
                    >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 mb-6 flex flex-col gap-1">
                    <span>Created: {formatDate(circuit.createdAt)}</span>
                    <span>Updated: {formatDate(circuit.updatedAt)}</span>
                  </div>

                  <button
                    onClick={() => navigate(`/editor/${circuit._id}`)}
                    className="w-full bg-slate-100 hover:bg-blue-50 text-blue-600 font-medium py-2 rounded-lg transition"
                  >
                    Open Editor
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
