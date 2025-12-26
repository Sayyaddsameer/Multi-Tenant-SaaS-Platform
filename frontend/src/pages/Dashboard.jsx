import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  
  // Unified stats state
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    totalTenants: 0 // Added for Super Admin
  });

  const [recentProjects, setRecentProjects] = useState([]);
  const [recentTenants, setRecentTenants] = useState([]); // Added for Super Admin
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (user.role === 'super_admin') {
          // --- SUPER ADMIN LOGIC ---
          // 1. Fetch Tenants
          const tenantsRes = await api.get('/tenants?limit=5');
          const tenants = tenantsRes.data.data.tenants || [];
          const totalTenants = tenantsRes.data.data.pagination.totalTenants;

          // 2. Fetch All Projects Count
          const projectsRes = await api.get('/projects');
          const totalProjects = projectsRes.data.data.pagination.totalProjects;

          setStats({
            totalTenants: totalTenants,
            totalProjects: totalProjects,
            totalTasks: 0, // Not relevant for high-level overview
            pendingTasks: 0,
            completedTasks: 0
          });

          setRecentTenants(tenants);

        } else {
          // --- REGULAR USER LOGIC (Your existing code) ---
          // 1. Fetch Projects
          const projectRes = await api.get('/projects?limit=5');
          const projects = projectRes.data.data.projects || [];
          const totalProjects = projectRes.data.data.pagination.totalProjects;

          // 2. Fetch Tasks (Dummy simulation as per your code)
          setStats({
            totalProjects: totalProjects,
            totalTasks: 12,
            pendingTasks: 5,
            completedTasks: 7,
            totalTenants: 0
          });

          setRecentProjects(projects);
        }

        setLoading(false);

      } catch (error) {
        console.error("Error loading dashboard", error);
        setLoading(false);
      }
    };

    if (user) fetchDashboardData();
  }, [user]);

  if (loading) return <div>Loading Dashboard...</div>;

  return (
    <div className="dashboard-container">
      <h2>Welcome, {user.fullName}!</h2>
      <p className="role-badge">Role: {user.role}</p>

      {/* --- SUPER ADMIN VIEW --- */}
      {user.role === 'super_admin' ? (
        <>
          {/* Super Admin Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Tenants</h3>
              <p className="stat-number">{stats.totalTenants}</p>
            </div>
            <div className="stat-card">
              <h3>Total Projects</h3>
              <p className="stat-number">{stats.totalProjects}</p>
            </div>
             {/* Placeholders to keep grid layout */}
            <div className="stat-card" style={{opacity: 0.5}}>
              <h3>System Health</h3>
              <p className="stat-number" style={{fontSize: '1.2rem'}}>Good</p>
            </div>
            <div className="stat-card" style={{opacity: 0.5}}>
              <h3>Active Users</h3>
              <p className="stat-number" style={{fontSize: '1.2rem'}}>--</p>
            </div>
          </div>

          <div className="content-grid">
            <div className="section-card" style={{ gridColumn: '1 / -1' }}>
              <h3>Recent Registrations</h3>
              {recentTenants.length === 0 ? (
                <p>No tenants found.</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Organization</th>
                      <th>Plan</th>
                      <th>Status</th>
                      <th>Users</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTenants.map((tenant) => (
                      <tr key={tenant.id}>
                        <td>{tenant.name}</td>
                        <td>{tenant.subscriptionPlan}</td>
                        <td><span className={`status-tag ${tenant.status}`}>{tenant.status}</span></td>
                        <td>{tenant.totalUsers || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      ) : (
        /* --- REGULAR USER VIEW (Your existing code) --- */
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Projects</h3>
              <p className="stat-number">{stats.totalProjects}</p>
            </div>
            <div className="stat-card">
              <h3>Total Tasks</h3>
              <p className="stat-number">{stats.totalTasks}</p>
            </div>
            <div className="stat-card warning">
              <h3>Pending</h3>
              <p className="stat-number">{stats.pendingTasks}</p>
            </div>
            <div className="stat-card success">
              <h3>Completed</h3>
              <p className="stat-number">{stats.completedTasks}</p>
            </div>
          </div>

          <div className="content-grid">
            {/* Recent Projects Section */}
            <div className="section-card">
              <h3>Recent Projects</h3>
              {recentProjects.length === 0 ? (
                <p>No projects found.</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Created By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentProjects.map((proj) => (
                      <tr key={proj.id}>
                        <td>{proj.name}</td>
                        <td><span className={`status-tag ${proj.status}`}>{proj.status}</span></td>
                        <td>{proj.creator?.fullName || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* My Tasks Section Placeholder */}
            <div className="section-card">
              <h3>My Pending Tasks</h3>
              <p className="placeholder-text">
                To view tasks, please navigate to a specific project.
                <br />
                <small>(Global task list API coming in next update)</small>
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;