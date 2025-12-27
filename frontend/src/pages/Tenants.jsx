import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import './Projects.css'; // Reuse existing CSS

const Tenants = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        // API 7: List All Tenants (Super Admin only)
        const { data } = await api.get('/tenants?limit=100');
        setTenants(data.data.tenants);
        setLoading(false);
      } catch (error) {
        toast.error('Failed to load tenants. Are you Super Admin?');
        setLoading(false);
      }
    };
    fetchTenants();
  }, []);

  if (loading) return <div>Loading Tenants...</div>;

  return (
    <div className="projects-container">
      <div className="page-header">
        <h2>Registered Organizations (Tenants)</h2>
      </div>

      <div className="users-list" style={{background: 'white', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'}}>
        <table className="data-table">
            <thead>
                <tr>
                    <th>Organization Name</th>
                    <th>Subdomain</th>
                    <th>Plan</th>
                    <th>Admin Status</th>
                    <th>Registered Date</th>
                </tr>
            </thead>
            <tbody>
                {tenants.map((tenant) => (
                    <tr key={tenant.id}>
                        <td style={{fontWeight: 'bold'}}>{tenant.name}</td>
                        <td>
                            <a href={`http://localhost:3000/login?subdomain=${tenant.subdomain}`} target="_blank" rel="noreferrer">
                                {tenant.subdomain}
                            </a>
                        </td>
                        <td>
                            <span className="status-badge active">{tenant.subscriptionPlan}</span>
                        </td>
                        <td>
                            <span className={`status-badge ${tenant.status === 'active' ? 'completed' : 'archived'}`}>
                                {tenant.status}
                            </span>
                        </td>
                        <td>{new Date(tenant.createdAt).toLocaleDateString()}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default Tenants;