'use client';

import { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function ManageBehaviors() {
  const [behaviors, setBehaviors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBehavior, setEditingBehavior] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [alert, setAlert] = useState(null);
  const [children] = useState(['Ella', 'Colton']);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    child: '',
    default_checked: false,
    visible: true
  });

  useEffect(() => {
    fetchBehaviors();
  }, []);

  const fetchBehaviors = async () => {
    try {
      const response = await fetch('/api/behaviors?includeHidden=true');
      if (!response.ok) throw new Error('Failed to fetch behaviors');
      const data = await response.json();
      setBehaviors(data);
    } catch (error) {
      showAlert('Error fetching behaviors: ' + error.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, type = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 5000);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      child: '',
      default_checked: false,
      visible: true
    });
    setEditingBehavior(null);
    setShowAddForm(false);
  };

  const handleEdit = (behavior) => {
    setFormData({
      name: behavior.name,
      description: behavior.description || '',
      child: behavior.child,
      default_checked: behavior.default_checked,
      visible: behavior.visible
    });
    setEditingBehavior(behavior);
    setShowAddForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.child) {
      showAlert('Name and child are required', 'danger');
      return;
    }

    try {
      const url = '/api/behaviors';
      const method = editingBehavior ? 'PUT' : 'POST';
      const body = editingBehavior 
        ? { ...formData, id: editingBehavior.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save behavior');
      }

      const savedBehavior = await response.json();
      
      if (editingBehavior) {
        setBehaviors(prev => prev.map(b => 
          b.id === editingBehavior.id ? savedBehavior : b
        ));
        showAlert('Behavior updated successfully!');
      } else {
        setBehaviors(prev => [...prev, savedBehavior]);
        showAlert('Behavior created successfully!');
      }

      resetForm();
    } catch (error) {
      showAlert(error.message, 'danger');
    }
  };

  const handleDelete = async (behavior) => {
    if (!confirm(`Are you sure you want to delete "${behavior.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/behaviors?id=${behavior.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete behavior');
      }

      setBehaviors(prev => prev.filter(b => b.id !== behavior.id));
      showAlert('Behavior deleted successfully!');
    } catch (error) {
      showAlert(error.message, 'danger');
    }
  };

  const handleToggleVisibility = async (behavior) => {
    try {
      const response = await fetch('/api/behaviors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...behavior,
          visible: !behavior.visible
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update behavior');
      }

      const updatedBehavior = await response.json();
      setBehaviors(prev => prev.map(b => 
        b.id === behavior.id ? updatedBehavior : b
      ));
      
      showAlert(`Behavior ${updatedBehavior.visible ? 'shown' : 'hidden'} successfully!`);
    } catch (error) {
      showAlert(error.message, 'danger');
    }
  };

  if (loading) {
    return <div className="container mt-4">Loading behaviors...</div>;
  }

  const groupedBehaviors = behaviors.reduce((groups, behavior) => {
    if (!groups[behavior.child]) {
      groups[behavior.child] = [];
    }
    groups[behavior.child].push(behavior);
    return groups;
  }, {});

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Manage Behaviors</h1>
        <div>
          <a href="/behavior" className="btn btn-outline-secondary me-2">
            Back to Tracking
          </a>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowAddForm(true)}
          >
            Add New Behavior
          </button>
        </div>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
          {alert.message}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setAlert(null)}
          ></button>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">
              {editingBehavior ? 'Edit Behavior' : 'Add New Behavior'}
            </h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Behavior Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Child *</label>
                  <select
                    className="form-select"
                    value={formData.child}
                    onChange={(e) => setFormData(prev => ({ ...prev, child: e.target.value }))}
                    required
                  >
                    <option value="">Select Child</option>
                    {children.map(child => (
                      <option key={child} value={child}>{child}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={formData.default_checked}
                      onChange={(e) => setFormData(prev => ({ ...prev, default_checked: e.target.checked }))}
                    />
                    <label className="form-check-label">
                      Default Checked
                    </label>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={formData.visible}
                      onChange={(e) => setFormData(prev => ({ ...prev, visible: e.target.checked }))}
                    />
                    <label className="form-check-label">
                      Visible
                    </label>
                  </div>
                </div>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary">
                  {editingBehavior ? 'Update' : 'Create'} Behavior
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={resetForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Behaviors List */}
      {Object.entries(groupedBehaviors).map(([child, childBehaviors]) => (
        <div key={child} className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">{child}'s Behaviors</h5>
          </div>
          <div className="card-body">
            {childBehaviors.length === 0 ? (
              <p className="text-muted">No behaviors configured for {child}</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Default Checked</th>
                      <th>Visible</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {childBehaviors.map(behavior => (
                      <tr key={behavior.id} className={!behavior.visible ? 'text-muted' : ''}>
                        <td>{behavior.name}</td>
                        <td>{behavior.description || '-'}</td>
                        <td>
                          <span className={`badge ${behavior.default_checked ? 'bg-success' : 'bg-secondary'}`}>
                            {behavior.default_checked ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${behavior.visible ? 'bg-success' : 'bg-warning'}`}>
                            {behavior.visible ? 'Visible' : 'Hidden'}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => handleEdit(behavior)}
                            >
                              Edit
                            </button>
                            <button
                              className={`btn ${behavior.visible ? 'btn-outline-warning' : 'btn-outline-success'}`}
                              onClick={() => handleToggleVisibility(behavior)}
                            >
                              {behavior.visible ? 'Hide' : 'Show'}
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleDelete(behavior)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ))}

      {behaviors.length === 0 && (
        <div className="text-center py-5">
          <h4 className="text-muted">No behaviors found</h4>
          <p className="text-muted">Click "Add New Behavior" to get started.</p>
        </div>
      )}
    </div>
  );
}