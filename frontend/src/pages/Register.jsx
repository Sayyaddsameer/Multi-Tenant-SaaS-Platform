import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const Register = () => {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    tenantName: '',
    subdomain: '',
    adminEmail: '',
    adminFullName: '',
    adminPassword: '',
    confirmPassword: '',
    plan: 'free' // Default selection
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.adminPassword !== formData.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    try {
      await register(formData);
      toast.success("Registration Successful! Please Login.");
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration Failed');
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      padding: '20px'
    },
    title: {
      marginBottom: '24px',
      color: '#333',
      fontSize: '2rem',
      fontWeight: '600'
    },
    form: {
      background: '#ffffff',
      padding: '40px',
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      width: '100%',
      maxWidth: '450px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    },
    label: {
      fontSize: '0.9rem',
      fontWeight: '600',
      color: '#555',
      marginBottom: '-8px'
    },
    input: {
      padding: '12px 16px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      fontSize: '1rem',
      outline: 'none',
      backgroundColor: '#fff',
      width: '100%',
      boxSizing: 'border-box'
    },
    subdomainWrapper: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      width: '100%'
    },
    suffix: {
      color: '#666',
      fontSize: '0.9rem',
      fontWeight: '500',
      whiteSpace: 'nowrap'
    },
    button: {
      backgroundColor: '#4A90E2',
      color: 'white',
      padding: '14px',
      border: 'none',
      borderRadius: '8px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      marginTop: '10px',
      transition: 'background-color 0.2s'
    },
    footerText: {
      marginTop: '20px',
      color: '#666',
      fontSize: '0.9rem'
    },
    link: {
      color: '#4A90E2',
      textDecoration: 'none',
      fontWeight: 'bold'
    }
  };

  return (
    <div className="auth-container" style={styles.container}>
      <h2 style={styles.title}>Register Organization</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input 
          name="tenantName" 
          placeholder="Organization Name" 
          onChange={handleChange} 
          required 
          style={styles.input}
        />
        
        <div className="subdomain-wrapper" style={styles.subdomainWrapper}>
            <input 
              name="subdomain" 
              placeholder="Subdomain" 
              onChange={handleChange} 
              required 
              style={styles.input}
            />
            <span className="suffix" style={styles.suffix}>.yourapp.com</span>
        </div>

        {/* Plan Selection Dropdown */}
        <label style={styles.label}>Subscription Plan</label>
        <select 
          name="plan" 
          value={formData.plan} 
          onChange={handleChange} 
          style={styles.input}
          required
        >
          <option value="free">Free (5 users, 3 projects)</option>
          <option value="pro">Pro (25 users, 15 projects)</option>
          <option value="enterprise">Enterprise (100 users, 50 projects)</option>
        </select>

        <input 
          name="adminFullName" 
          placeholder="Full Name" 
          onChange={handleChange} 
          required 
          style={styles.input}
        />
        <input 
          name="adminEmail" 
          type="email" 
          placeholder="Email" 
          onChange={handleChange} 
          required 
          style={styles.input}
        />
        
        <div className="password-group">
            <input 
                name="adminPassword" 
                type={showPassword ? "text" : "password"} 
                placeholder="Password" 
                onChange={handleChange} 
                required 
                style={styles.input}
            />
        </div>
        <input 
          name="confirmPassword" 
          type="password" 
          placeholder="Confirm Password" 
          onChange={handleChange} 
          required 
          style={styles.input}
        />

        <button type="submit" style={styles.button}>Register</button>
      </form>
      <p style={styles.footerText}>
        Already have an account? <Link to="/login" style={styles.link}>Login</Link>
      </p>
    </div>
  );
};

export default Register;