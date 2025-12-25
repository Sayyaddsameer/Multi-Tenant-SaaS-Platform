import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    pendingTasks: 0,
    completedTasks: 0
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. Fetch Projects (To calculate stats and show recent)
        const projectRes = await api.get('/projects?limit=5');
        const projects = projectRes.data.data.projects || [];
        const totalProjects = projectRes.data.data.pagination.totalProjects;

        // 2. Fetch User's Tasks (To show "My Tasks")
        // Note: We need to filter tasks assigned to current user. 
        // Our API listTasks supports filtering by assignedTo.
        const taskRes = await api.get(`/projects/${projects[0]?.id || 'dummy'}/tasks?assignedTo=${user.userId || user.id}`);
        // NOTE: The above line is tricky because our API expects projectId for tasks.
        // For a real global dashboard, we ideally need a "GET /tasks/me" endpoint.
        // For now, let's just use the projects we fetched to get stats.

        // Simulating stats calculation since we don't have a direct "dashboard stats" API yet
        // In a real app, create a dedicated endpoint: GET /api/dashboard/stats
        setStats({
          totalProjects: totalProjects,
          totalTasks: 12, // Dummy data for now until we build dedicated stats API
          pendingTasks: 5,
          completedTasks: 7
        });

        setRecentProjects(projects);
        setLoading(false);

      } catch (error) {
        console.error("Error loading dashboard", error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) return <div>Loading Dashboard...</div>;

  return (
    <div className="dashboard-container">
      <h2>Welcome, {user.fullName}!</h2>
      <p className="role-badge">Role: {user.role}</p>

      {/* Statistics Cards */}
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
    </div>
  );
};

export default Dashboard;