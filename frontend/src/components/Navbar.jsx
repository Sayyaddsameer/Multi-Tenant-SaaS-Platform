import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css'; // We'll create this next

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false); // Mobile menu toggle

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-logo">
          SaaS Platform
        </Link>

        {/* Hamburger Icon for Mobile */}
        <div className="menu-icon" onClick={() => setIsOpen(!isOpen)}>
          <i className={isOpen ? 'fas fa-times' : 'fas fa-bars'} />
        </div>

        <ul className={isOpen ? 'nav-menu active' : 'nav-menu'}>
          <li className="nav-item">
            <Link to="/dashboard" className="nav-links" onClick={() => setIsOpen(false)}>
              Dashboard
            </Link>
          </li>
          
          <li className="nav-item">
            <Link to="/projects" className="nav-links" onClick={() => setIsOpen(false)}>
              Projects
            </Link>
          </li>

          {/* Conditional: Tenant Admin Only */}
          {user.role === 'tenant_admin' && (
            <li className="nav-item">
              <Link to="/users" className="nav-links" onClick={() => setIsOpen(false)}>
                Users
              </Link>
            </li>
          )}

          {/* Conditional: Super Admin Only */}
          {user.role === 'super_admin' && (
            <li className="nav-item">
              <Link to="/tenants" className="nav-links" onClick={() => setIsOpen(false)}>
                Tenants
              </Link>
            </li>
          )}

          {/* User Profile Dropdown Placeholder */}
          <li className="nav-item user-profile">
            <span className="user-name">{user.fullName || user.email}</span>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;