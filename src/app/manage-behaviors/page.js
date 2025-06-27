'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
    return (
      <div className="container">
        <div className="card mt-8">
          <div className="text-center">
            <div style={{ padding: '2rem' }}>Loading behaviors...</div>
          </div>
        </div>
      </div>
    );
  }

  const groupedBehaviors = behaviors.reduce((groups, behavior) => {
    if (!groups[behavior.child]) {
      groups[behavior.child] = [];
    }
    groups[behavior.child].push(behavior);
    return groups;
  }, {});

  return (
    <div className="container">
      <main className="mt-8">
        <div className="card">
          <div className="card-header">
            <h1 className="card-title">Manage Behaviors</h1>
            <p className="card-subtitle">Create, edit, and organize behavior tracking for your children</p>
          </div>
          
          <div className="mb-6">
            <Link href="/home" className="btn btn-outline btn-sm mr-3">
              ← Back to Home
            </Link>
            <Link href="/behavior" className="btn btn-outline btn-sm mr-3">
              📝 Back to Tracking
            </Link>
            <button 
              className="btn btn-primary btn-sm" 
              onClick={() => setShowAddForm(true)}
            >
              + Add New Behavior
            </button>
          </div>

          {alert && (
            <div className={`card mb-6 ${alert.type === 'danger' ? 'text-error' : 'text-success'}`} 
                 style={{ backgroundColor: alert.type === 'danger' ? 'var(--color-error-light)' : 'var(--color-success-light)' }}>
              <div className="d-flex justify-between align-center">
                <span>{alert.message}</span>
                <button 
                  className="btn btn-sm btn-outline" 
                  onClick={() => setAlert(null)}
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="card mb-6">
              <div className="card-header">
                <h2 className="card-title text-lg">
                  {editingBehavior ? 'Edit Behavior' : 'Add New Behavior'}
                </h2>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="d-grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                  <div className="form-group">
                    <label className="form-label">Behavior Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Brush teeth, Make bed"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Child *</label>
                    <select
                      className="form-control"
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
                
                <div className="form-group mb-6">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description or instructions..."
                  />
                </div>
                
                <div className="d-grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                  <div>
                    <label className="d-flex align-center gap-3" style={{ cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.default_checked}
                        onChange={(e) => setFormData(prev => ({ ...prev, default_checked: e.target.checked }))}
                        style={{ transform: 'scale(1.2)' }}
                      />
                      <div>
                        <div className="font-medium">Default Checked</div>
                        <div className="text-sm text-secondary">Automatically checked when day starts</div>
                      </div>
                    </label>
                  </div>
                  
                  <div>
                    <label className="d-flex align-center gap-3" style={{ cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.visible}
                        onChange={(e) => setFormData(prev => ({ ...prev, visible: e.target.checked }))}
                        style={{ transform: 'scale(1.2)' }}
                      />
                      <div>
                        <div className="font-medium">Visible</div>
                        <div className="text-sm text-secondary">Show in behavior tracking</div>
                      </div>
                    </label>
                  </div>
                </div>
                
                <div className="d-flex gap-3">
                  <button type="submit" className="btn btn-primary">
                    {editingBehavior ? 'Update' : 'Create'} Behavior
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Behaviors List */}
          {Object.entries(groupedBehaviors).map(([child, childBehaviors]) => (
            <div key={child} className="card mb-6">
              <div className="card-header">
                <h2 className="card-title text-lg">{child}'s Behaviors ({childBehaviors.length})</h2>
              </div>
              
              {childBehaviors.length === 0 ? (
                <div className="text-center" style={{ padding: '3rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                  <p className="text-secondary">No behaviors configured for {child}</p>
                </div>
              ) : (
                <div className="d-flex gap-3" style={{ flexDirection: 'column' }}>
                  {childBehaviors.map(behavior => (
                    <div 
                      key={behavior.id} 
                      className={`card ${!behavior.visible ? 'opacity: 0.6' : ''}`}
                      style={{ 
                        padding: 'var(--space-4)',
                        backgroundColor: !behavior.visible ? 'var(--bg-tertiary)' : 'var(--bg-primary)'
                      }}
                    >
                      <div className="d-flex justify-between align-center">
                        <div style={{ flex: 1 }}>
                          <div className="d-flex align-center gap-3 mb-2">
                            <h3 className="font-medium text-lg">{behavior.name}</h3>
                            <div className="d-flex gap-2">
                              {behavior.default_checked && (
                                <span className="btn btn-sm btn-success" style={{ pointerEvents: 'none' }}>
                                  Default ✓
                                </span>
                              )}
                              <span className={`btn btn-sm ${behavior.visible ? 'btn-success' : 'btn-warning'}`} style={{ pointerEvents: 'none' }}>
                                {behavior.visible ? 'Visible' : 'Hidden'}
                              </span>
                            </div>
                          </div>
                          {behavior.description && (
                            <p className="text-secondary text-sm">{behavior.description}</p>
                          )}
                        </div>
                        
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleEdit(behavior)}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className={`btn btn-sm ${behavior.visible ? 'btn-warning' : 'btn-success'}`}
                            onClick={() => handleToggleVisibility(behavior)}
                          >
                            {behavior.visible ? '👁️ Hide' : '👁️ Show'}
                          </button>
                          <button
                            className="btn btn-error btn-sm"
                            onClick={() => handleDelete(behavior)}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {behaviors.length === 0 && (
            <div className="card">
              <div className="text-center" style={{ padding: '4rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📝</div>
                <h3 className="font-medium mb-2">No behaviors found</h3>
                <p className="text-secondary mb-4">Click "Add New Behavior" to get started setting up behavior tracking.</p>
                <button 
                  className="btn btn-primary" 
                  onClick={() => setShowAddForm(true)}
                >
                  + Add Your First Behavior
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}