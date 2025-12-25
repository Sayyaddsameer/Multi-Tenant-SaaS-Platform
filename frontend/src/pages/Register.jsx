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
    confirmPassword: ''
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

  return (
    <div className="auth-container">
      <h2>Register Organization</h2>
      <form onSubmit={handleSubmit}>
        <input name="tenantName" placeholder="Organization Name" onChange={handleChange} required />
        
        <div className="subdomain-wrapper">
            <input name="subdomain" placeholder="Subdomain" onChange={handleChange} required />
            <span className="suffix">.yourapp.com</span>
        </div>

        <input name="adminFullName" placeholder="Full Name" onChange={handleChange} required />
        <input name="adminEmail" type="email" placeholder="Email" onChange={handleChange} required />
        
        <div className="password-group">
            <input 
                name="adminPassword" 
                type={showPassword ? "text" : "password"} 
                placeholder="Password" 
                onChange={handleChange} 
                required 
            />
        </div>
        <input name="confirmPassword" type="password" placeholder="Confirm Password" onChange={handleChange} required />

        <button type="submit">Register</button>
      </form>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
};

export default Register;