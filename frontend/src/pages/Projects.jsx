import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './Projects.css';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { user } = useContext(AuthContext); // Get user for permission checks

  // Super Admin specific state
  const [tenants, setTenants] = useState([]);
  
  // Form State
  const [newProject, setNewProject] = useState({ 
    name: '', 
    description: '', 
    status: 'active',
    targetTenantId: '' // Added for Super Admin logic
  });

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data.data.projects);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load projects');
      setLoading(false);
    }
  };

  // --- LOGIC ADDED: Fetch Tenants for Super Admin ---
  useEffect(() => {
    fetchProjects();

    const fetchTenants = async () => {
        // Only fetch if user is super_admin
        if (user && user.role === 'super_admin') {
            try {
                // Fetch list of tenants for the dropdown
                const { data } = await api.get('/tenants?limit=100'); 
                setTenants(data.data.tenants);
            } catch (error) {
                console.error("Failed to load tenants for dropdown");
            }
        }
    };
    fetchTenants();
  }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    
    // --- LOGIC ADDED: Validation for Super Admin ---
    if (user.role === 'super_admin' && !newProject.targetTenantId) {
        return toast.error("Please select an organization");
    }

    try {
      await api.post('/projects', newProject);
      toast.success('Project Created!');
      setShowModal(false);
      // Reset form including targetTenantId
      setNewProject({ name: '', description: '', status: 'active', targetTenantId: '' }); 
      fetchProjects(); // Refresh list
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create project');
    }
  };

  const handleDelete = async (e, projectId) => {
    e.preventDefault(); // Stop the Link from navigating
    e.stopPropagation(); // Stop event bubbling

    if (!window.confirm("Are you sure you want to delete this project?")) {
      return;
    }

    try {
      await api.delete(`/projects/${projectId}`);
      toast.success("Project deleted");
      // Update UI immediately
      setProjects(projects.filter(p => p.id !== projectId));
    } catch (error) {
      toast.error("Failed to delete project");
    }
  };

  if (loading) return <div>Loading Projects...</div>;

  return (
    <div className="projects-container">
      <div className="page-header">
        <h2>Projects</h2>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
      </div>

      <div className="projects-grid">
        {projects.map((project) => (
          <Link to={`/projects/${project.id}`} key={project.id} className="project-card">
            <div className="card-header">
              <h3>{project.name}</h3>
              <span className={`status-badge ${project.status}`}>{project.status}</span>
            </div>
            <p>{project.description || 'No description provided.'}</p>
            
            <div className="card-footer">
              <div className="meta-info">
                 {/* --- LOGIC ADDED: Show Org Name for Super Admin --- */}
                 {user.role === 'super_admin' && project.tenant && (
                    <span style={{display: 'block', color: '#666', fontSize: '0.8rem', fontWeight: 'bold'}}>
                        Org: {project.tenant.name}
                    </span>
                 )}
                 <span>Created by: {project.creator?.fullName}</span>
                 <span>Tasks: {project._count?.tasks || 0}</span>
              </div>
              
              {/* Delete Button Logic */}
              {/* FIXED: Added ?.id to project.createdBy to correctly compare IDs */}
              {(user.role === 'super_admin' || user.role === 'tenant_admin' || user.id === project.createdBy?.id) && (
                  <button 
                    className="btn-danger-sm" 
                    onClick={(e) => handleDelete(e, project.id)}
                    style={{ zIndex: 10, position: 'relative' }} 
                  >
                    Delete
                  </button>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Create Project Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create New Project</h3>
            <form onSubmit={handleCreate}>
              
              {/* --- LOGIC ADDED: Tenant Dropdown for Super Admin --- */}
              {user.role === 'super_admin' && (
                  <div style={{marginBottom: '15px'}}>
                      <label style={{display:'block', marginBottom:'5px', fontWeight:'600', color:'#444'}}>Organization</label>
                      <select 
                        value={newProject.targetTenantId} 
                        onChange={(e) => setNewProject({...newProject, targetTenantId: e.target.value})}
                        required
                        style={{
                            width: '100%', 
                            padding: '10px', 
                            border: '1px solid #ddd', 
                            borderRadius: '4px',
                            backgroundColor: '#f9f9f9'
                        }}
                      >
                        <option value="">-- Select Organization --</option>
                        {tenants.map(t => (
                            <option key={t.id} value={t.id}>
                                {t.name} ({t.subdomain})
                            </option>
                        ))}
                      </select>
                  </div>
              )}

              <input 
                placeholder="Project Name" 
                value={newProject.name} 
                onChange={(e) => setNewProject({...newProject, name: e.target.value})} 
                required 
              />
              <textarea 
                placeholder="Description" 
                value={newProject.description} 
                onChange={(e) => setNewProject({...newProject, description: e.target.value})} 
              />
              <select 
                value={newProject.status} 
                onChange={(e) => setNewProject({...newProject, status: e.target.value})}
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;