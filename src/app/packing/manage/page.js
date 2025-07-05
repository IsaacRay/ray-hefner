"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PackingManagePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    templates: []
  });

  const availableTemplates = ['camping', 'beach', 'holidays', 'business', 'road_trip', 'international'];

  useEffect(() => {
    fetchPackingItems();
  }, []);

  const fetchPackingItems = async () => {
    try {
      const response = await fetch('/api/packing');
      if (!response.ok) {
        throw new Error('Failed to fetch packing items');
      }
      const data = await response.json();
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem ? `/api/packing` : '/api/packing';
      const method = editingItem ? 'PUT' : 'POST';
      const body = editingItem 
        ? { ...formData, id: editingItem.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to save item');
      }

      await fetchPackingItems();
      setShowForm(false);
      setEditingItem(null);
      setFormData({ name: '', description: '', category: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      category: item.category || '',
      templates: item.templates || []
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`/api/packing?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      await fetchPackingItems();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all packed items?')) return;

    try {
      const response = await fetch('/api/packing/reset', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to reset items');
      }

      await fetchPackingItems();
    } catch (err) {
      setError(err.message);
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({ name: '', description: '', category: '', templates: [] });
  };

  const handleTemplateChange = (template) => {
    setFormData(prev => ({
      ...prev,
      templates: prev.templates.includes(template)
        ? prev.templates.filter(t => t !== template)
        : [...prev.templates, template]
    }));
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ 
          fontSize: '2em', 
          color: '#333',
          margin: 0
        }}>
          Manage Packing Items
        </h1>
        <Link href="/packing" style={{
          padding: '10px 15px',
          backgroundColor: '#6c757d',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '5px',
          fontSize: '0.9em'
        }}>
          Back to Packing List
        </Link>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Add New Item
        </button>
        <button
          onClick={handleReset}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ffc107',
            color: '#212529',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Reset All Packed Items
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ marginTop: 0 }}>
            {editingItem ? 'Edit Item' : 'Add New Item'}
          </h3>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '1em'
              }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '1em',
                resize: 'vertical'
              }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Category
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '1em'
              }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
              Trip Templates
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {availableTemplates.map(template => (
                <label key={template} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.templates.includes(template)}
                    onChange={() => handleTemplateChange(template)}
                    style={{ marginRight: '5px' }}
                  />
                  <span style={{ 
                    padding: '5px 10px',
                    backgroundColor: formData.templates.includes(template) ? '#007bff' : '#f8f9fa',
                    color: formData.templates.includes(template) ? 'white' : '#333',
                    borderRadius: '15px',
                    fontSize: '0.9em',
                    border: '1px solid #dee2e6'
                  }}>
                    {template.replace('_', ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              {editingItem ? 'Update' : 'Add'} Item
            </button>
            <button
              type="button"
              onClick={cancelForm}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gap: '10px' }}>
        {items.map((item) => (
          <div 
            key={item.id}
            style={{
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ 
                fontSize: '1.1em', 
                fontWeight: 'bold', 
                marginBottom: '5px',
                color: '#333'
              }}>
                {item.name}
                {item.packed && <span style={{ color: '#28a745', marginLeft: '10px' }}>✓ Packed</span>}
              </div>
              {item.description && (
                <div style={{ 
                  fontSize: '0.9em', 
                  color: '#555',
                  marginBottom: '5px'
                }}>
                  {item.description}
                </div>
              )}
              {item.category && (
                <div style={{ 
                  fontSize: '0.8em', 
                  color: '#007bff',
                  fontWeight: '500',
                  marginBottom: '5px'
                }}>
                  Category: {item.category}
                </div>
              )}
              {item.templates && item.templates.length > 0 && (
                <div style={{ 
                  fontSize: '0.8em', 
                  color: '#495057',
                  fontWeight: '500'
                }}>
                  Templates: {item.templates.map(t => t.replace('_', ' ')).join(', ')}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => handleEdit(item)}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '0.9em'
                }}
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '0.9em'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}