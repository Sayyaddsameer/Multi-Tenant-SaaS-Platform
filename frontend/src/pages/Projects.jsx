import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';
import './Projects.css'; // We'll create this CSS file next

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [newProject, setNewProject] = useState({ name: '', description: '', status: 'active' });

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

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects', newProject);
      toast.success('Project Created!');
      setShowModal(false);
      setNewProject({ name: '', description: '', status: 'active' }); // Reset form
      fetchProjects(); // Refresh list
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create project');
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
              <span>Created by: {project.creator?.fullName}</span>
              <span>Tasks: {project._count?.tasks || 0}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Simple Modal Implementation */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create New Project</h3>
            <form onSubmit={handleCreate}>
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