import { useState } from 'react';
import { registerTenant } from '../api';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const [tenantName, setTenantName] = useState('Test Company Alpha');
  const [subdomain, setSubdomain] = useState('testalpha');
  const [adminEmail, setAdminEmail] = useState('admin@testalpha.com');
  const [adminFullName, setAdminFullName] = useState('Alpha Admin');
  const [adminPassword, setAdminPassword] = useState('TestPass@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const nav = useNavigate();

  async function onSubmit(e) {
    e.preventDefault(); setLoading(true); setError(''); setSuccess('');
    try {
      await registerTenant({ tenantName, subdomain, adminEmail, adminPassword, adminFullName });
      setSuccess('Tenant registered successfully. Redirecting to login…');
      setTimeout(()=>nav('/login'), 1500);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <div className="card stack">
        <h2>Register Tenant</h2>
        <form onSubmit={onSubmit}>
          <label>
            Organization Name
            <input value={tenantName} onChange={e=>setTenantName(e.target.value)} required />
          </label>
          <label>
            Subdomain
            <input value={subdomain} onChange={e=>setSubdomain(e.target.value)} required />
            <div className="muted">{subdomain}.yourapp.com</div>
          </label>
          <label>
            Admin Email
            <input value={adminEmail} onChange={e=>setAdminEmail(e.target.value)} type="email" required />
          </label>
          <label>
            Admin Full Name
            <input value={adminFullName} onChange={e=>setAdminFullName(e.target.value)} required />
          </label>
          <label>
            Password
            <input value={adminPassword} onChange={e=>setAdminPassword(e.target.value)} type="password" required />
          </label>
          <button className="btn btn-primary" type="submit" disabled={loading}>{loading?'Registering…':'Register'}</button>
        </form>
        {error && <div className="alert error">{error}</div>}
        {success && <div className="alert success">{success}</div>}
        <div className="muted">Already have an account? <Link to="/login">Login</Link></div>
      </div>
    </div>
  );
}
