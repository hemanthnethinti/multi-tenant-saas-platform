import { useState } from 'react';
import { login, setToken } from '../api';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('Demo@123');
  const [subdomain, setSubdomain] = useState('demo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const nav = useNavigate();

  async function onSubmit(e) {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const resp = await login(email, password, subdomain);
      setToken(resp.data.token);
      nav('/dashboard');
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <div className="card stack">
        <h2>Login</h2>
        <form onSubmit={onSubmit}>
          <label>
            Email
            <input value={email} onChange={e=>setEmail(e.target.value)} type="email" required />
          </label>
          <label>
            Password
            <input value={password} onChange={e=>setPassword(e.target.value)} type="password" required />
          </label>
          <label>
            Tenant Subdomain
            <input value={subdomain} onChange={e=>setSubdomain(e.target.value)} required />
          </label>
          <button className="btn btn-primary" type="submit" disabled={loading}>{loading?'Logging in…':'Login'}</button>
        </form>
        {error && <div className="alert error">{error}</div>}
        <div className="muted">New tenant? <Link to="/register">Register</Link></div>
      </div>
    </div>
  );
}
