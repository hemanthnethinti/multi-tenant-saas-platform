import './App.css';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import { getToken, clearToken } from './api';

function Protected({ children }) {
  const token = getToken();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function Nav() {
  return (
    <div className="nav">
      <div className="nav-inner">
        <Link to="/dashboard">Dashboard</Link>
        <span className="spacer" />
        <button className="btn btn-outline" onClick={() => { clearToken(); window.location.href = '/login'; }}>Logout</button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Protected><Nav /><div className="container"><Dashboard /></div></Protected>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
