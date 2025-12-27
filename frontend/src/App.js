import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Users from './pages/Users';
import Tenants from './pages/Tenants'; // <--- NEW IMPORT

// Layout Wrapper for Protected Pages
const ProtectedLayout = () => (
  <>
    <Navbar />
    <div className="main-content" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <Outlet />
    </div>
  </>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <ToastContainer position="top-right" autoClose={3000} />
          <Routes>
            {/* Public Routes */}
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes with Navbar */}
            <Route element={<ProtectedRoute />}>
              <Route element={<ProtectedLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* Project Routes */}
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:id" element={<ProjectDetails />} />

                {/* Tenant Admin Route */}
                <Route path="/users" element={<Users />} />

                {/* Super Admin Route */}
                <Route path="/tenants" element={<Tenants />} /> 
                
                {/* Default Redirect */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;