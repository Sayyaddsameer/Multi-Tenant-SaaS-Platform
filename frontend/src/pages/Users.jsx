import React, { useEffect, useState, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './Projects.css'; // We can reuse the same CSS for consistency

const Users = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [newUser, setNewUser] = useState({ 
    email: '', 
    password: '', 
    fullName: '', 
    role: 'user' 
  });

  // Fetch Users
  const fetchUsers = async () => {
    try {
      // API 9: List Users (Requires tenantId from AuthContext)
      // Note: user.tenantId comes from the decoded JWT token
      const { data } = await api.get(`/tenants/${user.tenantId}/users`);
      setUsers(data.data.users);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load users');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.tenantId) {
      fetchUsers();
    }
  }, [user]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      // API 8: Add User
      await api.post(`/tenants/${user.tenantId}/users`, newUser);
      toast.success('User Added Successfully!');
      setShowModal(false);
      setNewUser({ email: '', password: '', fullName: '', role: 'user' });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to remove this user?")) return;
    try {
      // API 11: Delete User
      await api.delete(`/users/${userId}`);
      toast.success('User removed');
      setUsers(users.filter(u => u.id !== userId));
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  if (loading) return <div>Loading Users...</div>;

  return (
    <div className="projects-container">
      <div className="page-header">
        <h2>Team Members</h2>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add Member</button>
      </div>

      <div className="users-list" style={{background: 'white', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'}}>
        <table className="data-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {users.map((member) => (
                    <tr key={member.id}>
                        <td>{member.fullName}</td>
                        <td>{member.email}</td>
                        <td>
                            <span className={`status-badge ${member.role === 'tenant_admin' ? 'active' : 'completed'}`}>
                                {member.role.replace('_', ' ')}
                            </span>
                        </td>
                        <td>{member.isActive ? 'Active' : 'Inactive'}</td>
                        <td>
                            {member.id !== user.userId && member.id !== user.id && (
                                <button 
                                    onClick={() => handleDeleteUser(member.id)}
                                    style={{background: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer'}}
                                >
                                    Remove
                                </button>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Team Member</h3>
            <form onSubmit={handleCreateUser}>
              <input 
                placeholder="Full Name" 
                value={newUser.fullName} 
                onChange={(e) => setNewUser({...newUser, fullName: e.target.value})} 
                required 
              />
              <input 
                type="email"
                placeholder="Email Address" 
                value={newUser.email} 
                onChange={(e) => setNewUser({...newUser, email: e.target.value})} 
                required 
              />
              <input 
                type="password"
                placeholder="Default Password" 
                value={newUser.password} 
                onChange={(e) => setNewUser({...newUser, password: e.target.value})} 
                required 
              />
              <select 
                value={newUser.role} 
                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
              >
                <option value="user">Standard User</option>
                <option value="tenant_admin">Admin</option>
              </select>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Add User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;