import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './Projects.css'; // Reuse CSS

const ProjectDetails = () => {
  const { id } = useParams(); // Get project ID from URL
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  
  // Task Form State
  const [newTask, setNewTask] = useState({ title: '', priority: 'medium', assignedTo: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Parallel fetch for speed
        const [projRes, taskRes] = await Promise.all([
          api.get(`/projects`), // Ideally we should have GET /projects/:id
          api.get(`/projects/${id}/tasks`)
        ]);

        // Note: Since we didn't implement GET /projects/:id specifically, 
        // we find the project from the list. 
        const foundProject = projRes.data.data.projects.find(p => p.id === id);
        
        if (!foundProject) {
            toast.error("Project not found");
            return navigate('/projects');
        }

        setProject(foundProject);
        setTasks(taskRes.data.data.tasks);
        setLoading(false);
      } catch (error) {
        toast.error('Failed to load details');
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      // Default assign to current user if empty
      const payload = { 
        ...newTask, 
        assignedTo: newTask.assignedTo || user.userId || user.id 
      };
      
      await api.post(`/projects/${id}/tasks`, payload);
      toast.success('Task Added!');
      setShowTaskModal(false);
      setNewTask({ title: '', priority: 'medium', assignedTo: '' });
      
      // Refresh tasks
      const { data } = await api.get(`/projects/${id}/tasks`);
      setTasks(data.data.tasks);
    } catch (error) {
      toast.error('Failed to add task');
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      // Update local state instantly (Optimistic UI)
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="projects-container">
      <div className="page-header">
         <div>
            <button onClick={() => navigate('/projects')} className="btn-secondary" style={{marginRight: '15px'}}>← Back</button>
            <h2 style={{display: 'inline'}}>{project.name}</h2>
         </div>
         <button className="btn-primary" onClick={() => setShowTaskModal(true)}>+ Add Task</button>
      </div>

      <div className="project-meta" style={{background: 'white', padding: '15px', borderRadius: '8px', marginBottom: '20px'}}>
        <p><strong>Description:</strong> {project.description}</p>
        <p><strong>Status:</strong> <span className={`status-badge ${project.status}`}>{project.status}</span></p>
      </div>

      <h3>Tasks</h3>
      <div className="tasks-list">
        {tasks.length === 0 ? <p>No tasks yet. Add one!</p> : (
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Assigned To</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {tasks.map(task => (
                        <tr key={task.id}>
                            <td>{task.title}</td>
                            <td>{task.assignee?.fullName || 'Unassigned'}</td>
                            <td>{task.priority}</td>
                            <td>
                                <select 
                                    value={task.status} 
                                    onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                                    className={`status-badge ${task.status}`}
                                    style={{border: 'none', cursor: 'pointer'}}
                                >
                                    <option value="todo">To Do</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </td>
                            <td>
                                <small>{new Date(task.createdAt).toLocaleDateString()}</small>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )}
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Task</h3>
            <form onSubmit={handleCreateTask}>
              <input 
                placeholder="Task Title" 
                value={newTask.title} 
                onChange={(e) => setNewTask({...newTask, title: e.target.value})} 
                required 
              />
              <select 
                value={newTask.priority} 
                onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowTaskModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Add Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;