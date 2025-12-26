import { useEffect, useState } from 'react';
import { me, listProjects } from '../api';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const u = await me();
        setUser(u.data);
        const p = await listProjects({ limit: 5 });
        setProjects(p.data.projects || []);
      } catch (e) { setError(e.message); }
    })();
  }, []);

  if (error) return <div className="alert error">{error}</div>;
  return (
    <div className="card stack">
      <h2>Dashboard</h2>
      {user && (
        <div className="stack">
          <div>Welcome, {user.fullName} ({user.role})</div>
          {user.tenant && <div className="muted">Tenant: {user.tenant.name} ({user.tenant.subscriptionPlan})</div>}
        </div>
      )}
      <div className="stack">
        <h3>Recent Projects</h3>
        <ul className="list">
          {projects.map(p => (
            <li className="list-item" key={p.id}>
              <strong>{p.name}</strong> — {p.status} — tasks: {p.taskCount} (completed {p.completedTaskCount})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
