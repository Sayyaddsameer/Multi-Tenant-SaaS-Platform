import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    tenantSubdomain: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(formData.email, formData.password, formData.tenantSubdomain);
      toast.success("Login Successful");
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid Credentials');
    }
  };

  // Inline style objects
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
      maxWidth: '400px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    },
    input: {
      padding: '12px 16px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      fontSize: '1rem',
      outline: 'none',
      backgroundColor: '#fff'
    },
    button: {
      backgroundColor: '#4A90E2',
      color: 'white',
      padding: '12px',
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
<<<<<<< HEAD
    <div className="auth-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input name="tenantSubdomain" placeholder="Organization Subdomain" onChange={handleChange} required={false} />
        <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
=======
    <div className="auth-container" style={styles.container}>
      <h2 style={styles.title}>Login</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input 
          name="tenantSubdomain" 
          placeholder="Organization Subdomain" 
          onChange={handleChange} 
          required={false} 
          style={styles.input}
        />
        <input 
          name="email" 
          type="email" 
          placeholder="Email" 
          onChange={handleChange} 
          required 
          style={styles.input}
        />
        <input 
          name="password" 
          type="password" 
          placeholder="Password" 
          onChange={handleChange} 
          required 
          style={styles.input}
        />
>>>>>>> 3abe207 (feat(frontend): apply inline styling to login page)
        
        <button type="submit" style={styles.button}>Login</button>
      </form>
      <p style={styles.footerText}>
        New here? <Link to="/register" style={styles.link}>Register</Link>
      </p>
    </div>
  );
};

export default Login;
