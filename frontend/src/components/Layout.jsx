import React, { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Layout.css';

const Layout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">SaaS Platform</div>
        <nav className="nav-links">
          <Link to="/dashboard" className={`nav-item ${isActive('/dashboard')}`}>Dashboard</Link>
          <Link to="/projects" className={`nav-item ${isActive('/projects')}`}>Projects</Link>
          
          {user?.role === 'tenant_admin' && (
            <Link to="/users" className={`nav-item ${isActive('/users')}`}>Team Members</Link>
          )}
          
          {user?.role === 'super_admin' && (
            <Link to="/tenants" className={`nav-item ${isActive('/tenants')}`}>Tenants</Link>
          )}
        </nav>
        
        <div className="user-profile">
          <div style={{fontSize: '0.85rem', fontWeight: '600'}}>{user?.fullName}</div>
          <div style={{fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.5rem'}}>{user?.email}</div>
          <button onClick={handleLogout} className="btn btn-outline" style={{width: '100%'}}>Logout</button>
        </div>
      </aside>
      
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;