"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PackingManagePage() {
  const [items, setItems] = useState([]);
  const [savedTrips, setSavedTrips] = useState([]);
  const [activeTrips, setActiveTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showTripForm, setShowTripForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newTripName, setNewTripName] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    templates: []
  });
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedTemplate, setDraggedTemplate] = useState(null);
  const [touchStartPos, setTouchStartPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const availableTemplates = ['camping', 'beach', 'holidays', 'business', 'road_trip', 'international'];

  useEffect(() => {
    fetchPackingItems();
    fetchSavedTrips();
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

  const fetchSavedTrips = async () => {
    try {
      const response = await fetch('/api/packing/trip');
      if (!response.ok) {
        throw new Error('Failed to fetch saved trips');
      }
      const data = await response.json();
      setSavedTrips(data);
    } catch (err) {
      console.error('Error fetching saved trips:', err);
    }
  };

  const createTrip = () => {
    if (!newTripName.trim()) return;
    
    const newTrip = {
      id: Date.now(),
      name: newTripName,
      items: [],
      isActive: true
    };
    
    setActiveTrips([...activeTrips, newTrip]);
    setNewTripName('');
    setShowTripForm(false);
  };

  const deleteActiveTrip = (tripId) => {
    setActiveTrips(activeTrips.filter(trip => trip.id !== tripId));
  };

  const addItemToTrip = (tripId, item) => {
    setActiveTrips(activeTrips.map(trip => 
      trip.id === tripId 
        ? { ...trip, items: [...trip.items, { ...item, id: Date.now() + Math.random() }] }
        : trip
    ));
  };

  const addTemplateToTrip = async (tripId, templateName) => {
    try {
      const response = await fetch(`/api/packing/template?template=${templateName}`);
      if (!response.ok) {
        throw new Error('Failed to load template');
      }
      const templateItems = await response.json();
      
      setActiveTrips(activeTrips.map(trip => 
        trip.id === tripId 
          ? { ...trip, items: [...trip.items, ...templateItems.map(item => ({ ...item, id: Date.now() + Math.random() }))] }
          : trip
      ));
    } catch (err) {
      setError(err.message);
    }
  };

  const addSavedTripToTrip = (tripId, savedTrip) => {
    setActiveTrips(activeTrips.map(trip => 
      trip.id === tripId 
        ? { ...trip, items: [...trip.items, ...savedTrip.items.map(item => ({ ...item, id: Date.now() + Math.random() }))] }
        : trip
    ));
  };

  const handleDragStart = (e, item, type) => {
    if (type === 'item') {
      setDraggedItem(item);
      e.dataTransfer.effectAllowed = 'copy';
    } else if (type === 'template') {
      setDraggedTemplate(item);
      e.dataTransfer.effectAllowed = 'copy';
    }
  };

  const handleTouchStart = (e, item, type) => {
    const touch = e.touches[0];
    setTouchStartPos({ x: touch.clientX, y: touch.clientY });
    setIsDragging(true);
    
    if (type === 'item') {
      setDraggedItem(item);
    } else if (type === 'template') {
      setDraggedTemplate(item);
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    e.preventDefault(); // Prevent scrolling while dragging
  };

  const handleTouchEnd = (e) => {
    if (!isDragging) return;
    
    const touch = e.changedTouches[0];
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    
    // Find the closest trip container
    let tripContainer = elementBelow;
    while (tripContainer && !tripContainer.dataset.tripId) {
      tripContainer = tripContainer.parentElement;
    }
    
    if (tripContainer && tripContainer.dataset.tripId) {
      const tripId = parseInt(tripContainer.dataset.tripId);
      
      if (draggedItem) {
        addItemToTrip(tripId, draggedItem);
        setDraggedItem(null);
      } else if (draggedTemplate) {
        if (draggedTemplate.type === 'standard') {
          addTemplateToTrip(tripId, draggedTemplate.name);
        } else if (draggedTemplate.type === 'saved') {
          addSavedTripToTrip(tripId, draggedTemplate);
        }
        setDraggedTemplate(null);
      }
    }
    
    setIsDragging(false);
    setDraggedItem(null);
    setDraggedTemplate(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e, tripId) => {
    e.preventDefault();
    
    if (draggedItem) {
      addItemToTrip(tripId, draggedItem);
      setDraggedItem(null);
    } else if (draggedTemplate) {
      if (draggedTemplate.type === 'standard') {
        addTemplateToTrip(tripId, draggedTemplate.name);
      } else if (draggedTemplate.type === 'saved') {
        addSavedTripToTrip(tripId, draggedTemplate);
      }
      setDraggedTemplate(null);
    }
  };

  const removeItemFromTrip = (tripId, itemId) => {
    setActiveTrips(activeTrips.map(trip => 
      trip.id === tripId 
        ? { ...trip, items: trip.items.filter(item => item.id !== itemId) }
        : trip
    ));
  };

  const saveTripTemplate = async (trip) => {
    try {
      const response = await fetch('/api/packing/trip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: trip.name,
          items: trip.items.map(item => ({
            name: item.name,
            quantity: item.quantity || 1
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save trip');
      }

      fetchSavedTrips();
      deleteActiveTrip(trip.id);
    } catch (err) {
      setError(err.message);
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
      setFormData({ name: '', templates: [] });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
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
    setFormData({ name: '', templates: [] });
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
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ 
          fontSize: '2em', 
          color: '#333',
          margin: 0
        }}>
          Trip Planning & Item Management
        </h1>
        <Link href="/packing" style={{
          padding: '10px 15px',
          backgroundColor: '#6c757d',
          color: '#f8f9fa',
          textDecoration: 'none',
          borderRadius: '5px',
          fontSize: '0.9em'
        }}>
          Back to Packing List
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* Left Column - Items & Templates */}
        <div>
          <h2 style={{ fontSize: '1.5em', marginBottom: '20px', color: '#333' }}>Items & Templates</h2>
          
          {/* Trip Creation */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={() => setShowTripForm(!showTripForm)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: '#f8f9fa',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Create New Trip
              </button>
              <button
                onClick={() => setShowForm(true)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#28a745',
                  color: '#f8f9fa',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Add New Item
              </button>
            </div>
            
            {showTripForm && (
              <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
                <input
                  type="text"
                  placeholder="Trip name"
                  value={newTripName}
                  onChange={(e) => setNewTripName(e.target.value)}
                  style={{
                    width: '200px',
                    padding: '8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    marginRight: '10px'
                  }}
                />
                <button
                  onClick={createTrip}
                  style={{
                    padding: '8px 15px',
                    backgroundColor: '#007bff',
                    color: '#f8f9fa',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginRight: '10px'
                  }}
                >
                  Create
                </button>
                <button
                  onClick={() => setShowTripForm(false)}
                  style={{
                    padding: '8px 15px',
                    backgroundColor: '#6c757d',
                    color: '#f8f9fa',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Standard Templates */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '1.2em', marginBottom: '15px', color: '#333' }}>Standard Templates</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              {availableTemplates.map(template => (
                <div
                  key={template}
                  draggable
                  onDragStart={(e) => handleDragStart(e, { name: template, type: 'standard' }, 'template')}
                  onTouchStart={(e) => handleTouchStart(e, { name: template, type: 'standard' }, 'template')}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  style={{
                    padding: '15px',
                    backgroundColor: '#e3f2fd',
                    borderRadius: '8px',
                    border: '2px solid #2196f3',
                    cursor: 'grab',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    touchAction: 'none',
                    opacity: isDragging && (draggedTemplate?.name === template && draggedTemplate?.type === 'standard') ? 0.5 : 1
                  }}
                >
                  <span style={{ fontWeight: 'bold' }}>{template.replace('_', ' ')}</span>
                  <span style={{ fontSize: '0.9em', color: '#666' }}>📦 Template</span>
                </div>
              ))}
            </div>
          </div>

          {/* Saved Trips */}
          {savedTrips.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '1.2em', marginBottom: '15px', color: '#333' }}>Saved Trips</h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                {savedTrips.map(trip => (
                  <div
                    key={trip.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, { ...trip, type: 'saved' }, 'template')}
                    onTouchStart={(e) => handleTouchStart(e, { ...trip, type: 'saved' }, 'template')}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    style={{
                      padding: '15px',
                      backgroundColor: '#e8f5e8',
                      borderRadius: '8px',
                      border: '2px solid #4caf50',
                      cursor: 'grab',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      touchAction: 'none',
                      opacity: isDragging && (draggedTemplate?.id === trip.id && draggedTemplate?.type === 'saved') ? 0.5 : 1
                    }}
                  >
                    <span style={{ fontWeight: 'bold' }}>{trip.name}</span>
                    <span style={{ fontSize: '0.9em', color: '#666' }}>💾 Saved ({trip.items.length} items)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Individual Items */}
          <div>
            <h3 style={{ fontSize: '1.2em', marginBottom: '15px', color: '#333' }}>Individual Items</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item, 'item')}
                  onTouchStart={(e) => handleTouchStart(e, item, 'item')}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  style={{
                    padding: '15px',
                    backgroundColor: '#fff3e0',
                    borderRadius: '8px',
                    border: '2px solid #ff9800',
                    cursor: 'grab',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    touchAction: 'none',
                    opacity: isDragging && draggedItem?.id === item.id ? 0.5 : 1
                  }}
                >
                  <span style={{ fontWeight: 'bold' }}>{item.name}</span>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleEdit(item)}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#007bff',
                        color: '#f8f9fa',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '0.8em'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#dc3545',
                        color: '#f8f9fa',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '0.8em'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Active Trips */}
        <div>
          <h2 style={{ fontSize: '1.5em', marginBottom: '20px', color: '#333' }}>Active Trips</h2>
          
          {activeTrips.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#666', 
              padding: '40px',
              border: '2px dashed #ccc',
              borderRadius: '8px'
            }}>
              <h3>No Active Trips</h3>
              <p>Create a new trip to start planning!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              {activeTrips.map(trip => (
                <div
                  key={trip.id}
                  data-trip-id={trip.id}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, trip.id)}
                  style={{
                    padding: '20px',
                    backgroundColor: isDragging ? '#e8f5e8' : '#f8f9fa',
                    borderRadius: '8px',
                    border: isDragging ? '2px dashed #28a745' : '2px solid #dee2e6',
                    minHeight: '200px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0, color: '#333' }}>{trip.name}</h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => saveTripTemplate(trip)}
                        style={{
                          padding: '8px 15px',
                          backgroundColor: '#28a745',
                          color: '#f8f9fa',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.9em'
                        }}
                      >
                        Save Template
                      </button>
                      <button
                        onClick={() => deleteActiveTrip(trip.id)}
                        style={{
                          padding: '8px 15px',
                          backgroundColor: '#dc3545',
                          color: '#f8f9fa',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.9em'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <div 
                    data-trip-id={trip.id}
                    style={{ 
                      minHeight: '100px',
                      border: '2px dashed #6c757d',
                      borderRadius: '5px',
                      padding: '10px',
                      backgroundColor: '#fff'
                    }}>
                    {trip.items.length === 0 ? (
                      <p style={{ 
                        textAlign: 'center', 
                        color: '#666',
                        margin: '40px 0',
                        fontSize: '0.9em'
                      }}>
                        Drag items or templates here
                      </p>
                    ) : (
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {trip.items.map(item => (
                          <div 
                            key={item.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 12px',
                              backgroundColor: '#e9ecef',
                              borderRadius: '4px'
                            }}
                          >
                            <span>{item.name}</span>
                            <button
                              onClick={() => removeItemFromTrip(trip.id, item.id)}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#dc3545',
                                color: '#f8f9fa',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '0.8em'
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Item Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <form onSubmit={handleSubmit} style={{
            backgroundColor: '#f8f9fa',
            padding: '30px',
            borderRadius: '8px',
            width: '500px',
            maxWidth: '90vw'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>
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
            <div style={{ marginBottom: '20px' }}>
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
                  color: '#f8f9fa',
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
                  color: '#f8f9fa',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}