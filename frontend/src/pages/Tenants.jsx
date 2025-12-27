import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import './Projects.css'; // Reuse existing CSS

const Tenants = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- ADDED: State for Editing ---
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);

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

  useEffect(() => {
    fetchTenants();
  }, []);

  // --- ADDED: Handle Edit Click ---
  const handleEditClick = (tenant) => {
    setEditingTenant({ ...tenant }); // Create a copy to edit
    setShowEditModal(true);
  };

  // --- ADDED: Handle Update Submission (API 6) ---
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      // API 6: Update Tenant
      await api.put(`/tenants/${editingTenant.id}`, {
        name: editingTenant.name,
        status: editingTenant.status,
        subscriptionPlan: editingTenant.subscriptionPlan,
        maxUsers: parseInt(editingTenant.maxUsers),      // Ensure number
        maxProjects: parseInt(editingTenant.maxProjects) // Ensure number
      });
      
      toast.success('Tenant Updated Successfully!');
      setShowEditModal(false);
      fetchTenants(); // Refresh the list to show changes
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update tenant');
    }
  };

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
                    <th>Action</th> {/* Added Action Column */}
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
                        {/* Added Edit Button */}
                        <td>
                            <button 
                                className="btn-secondary" 
                                style={{padding: '5px 10px', fontSize: '0.8rem'}}
                                onClick={() => handleEditClick(tenant)}
                            >
                                Edit
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* --- ADDED: Edit Tenant Modal --- */}
      {showEditModal && editingTenant && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit Tenant Settings</h3>
            <form onSubmit={handleUpdate}>
              
              {/* Name */}
              <div className="form-group">
                <label>Organization Name</label>
                <input 
                    value={editingTenant.name} 
                    onChange={(e) => setEditingTenant({...editingTenant, name: e.target.value})} 
                    required 
                />
              </div>

              {/* Status */}
              <div className="form-group">
                <label>Status</label>
                <select 
                    value={editingTenant.status} 
                    onChange={(e) => setEditingTenant({...editingTenant, status: e.target.value})}
                    style={{width: '100%', padding: '8px', marginTop: '5px'}}
                >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="trial">Trial</option>
                </select>
              </div>

              {/* Subscription Plan */}
              <div className="form-group">
                <label>Subscription Plan</label>
                <select 
                    value={editingTenant.subscriptionPlan} 
                    onChange={(e) => setEditingTenant({...editingTenant, subscriptionPlan: e.target.value})}
                    style={{width: '100%', padding: '8px', marginTop: '5px'}}
                >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                </select>
              </div>

              {/* Manual Limits Override */}
              <div style={{display: 'flex', gap: '15px', marginTop: '15px'}}>
                  <div className="form-group" style={{flex: 1}}>
                    <label>Max Users</label>
                    <input 
                        type="number"
                        value={editingTenant.maxUsers || 0} 
                        onChange={(e) => setEditingTenant({...editingTenant, maxUsers: e.target.value})} 
                    />
                  </div>
                  <div className="form-group" style={{flex: 1}}>
                    <label>Max Projects</label>
                    <input 
                        type="number"
                        value={editingTenant.maxProjects || 0} 
                        onChange={(e) => setEditingTenant({...editingTenant, maxProjects: e.target.value})} 
                    />
                  </div>
              </div>

              <div className="modal-actions" style={{marginTop: '20px'}}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tenants;