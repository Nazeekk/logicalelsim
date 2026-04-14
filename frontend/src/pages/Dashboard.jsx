import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-800">Logicism</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">{user?.email}</span>
          <button 
            onClick={handleLogout}
            className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800">My Circuits</h2>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition">
              + New Circuit
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-center justify-center text-slate-400">
              No circuits found. Create your first one!
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;