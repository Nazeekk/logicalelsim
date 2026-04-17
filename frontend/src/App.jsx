import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import { useAuthStore } from './store/authStore';
import './index.css';
import { Toaster } from 'react-hot-toast';
import { ReactFlowProvider } from 'reactflow';

const ProtectedRoute = ({ children }) => {
  const token = useAuthStore((state) => state.token);
  if (!token) return <Navigate to="/" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const token = useAuthStore((state) => state.token);
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Toaster position='bottom-right' toastOptions={{ className: 'text-sm font-medium' }} />
      <Routes>
        <Route
          path="/"
          element={
            <PublicRoute>
              <AuthPage />
            </PublicRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editor/:id"
          element={
            <ProtectedRoute >
              <ReactFlowProvider>
                <Editor />
              </ReactFlowProvider>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
