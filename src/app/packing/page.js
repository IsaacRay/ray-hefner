"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PackingPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  // Removed description and category fields
  const [tripName, setTripName] = useState('');
  const [showSaveTrip, setShowSaveTrip] = useState(false);
  const [savedTrips, setSavedTrips] = useState([]);
  const [pinnedTrip, setPinnedTrip] = useState(null);
  const [showPinTrip, setShowPinTrip] = useState(false);
  const [pinnedTripName, setPinnedTripName] = useState('');

  const availableTemplates = ['camping', 'beach', 'holidays', 'business', 'road_trip', 'international'];

  useEffect(() => {
    const initializePage = async () => {
      try {
        await fetchSavedTrips();
        loadPinnedTrip();
      } catch (error) {
        console.error('Error initializing page:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initializePage();
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

  const togglePacked = async (id, currentStatus) => {
    try {
      // Check if this is a temporary item (from loaded trip) or database item
      const item = items.find(item => item.id === id);
      const isTemporaryItem = typeof id === 'number' && id > 1000000000000; // Temporary IDs are large timestamps
      
      if (!isTemporaryItem) {
        // Only make API call for database items
        const response = await fetch('/api/packing', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id, packed: !currentStatus }),
        });

        if (!response.ok) {
          throw new Error('Failed to update item');
        }
      }

      // Update local state for both temporary and database items
      const updatedItems = items.map(item => 
        item.id === id ? { ...item, packed: !currentStatus } : item
      );
      setItems(updatedItems);
      if (pinnedTrip) {
        updatePinnedTrip(updatedItems);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const loadTemplate = async (template) => {
    try {
      const response = await fetch(`/api/packing/template?template=${template}`);
      if (!response.ok) {
        throw new Error('Failed to load template');
      }
      const data = await response.json();
      setItems(data);
      setShowTemplateSelector(false);
      setSelectedTemplate(template);
      if (pinnedTrip) {
        updatePinnedTrip(data);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const loadTrip = async (trip) => {
    try {
      const itemsWithIds = trip.items.map(item => ({
        ...item,
        id: Date.now() + Math.random(),
        packed: false
      }));
      setItems(itemsWithIds);
      setShowTemplateSelector(false);
      setSelectedTemplate(trip.name);
      if (pinnedTrip) {
        updatePinnedTrip(itemsWithIds);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const pinExistingTrip = async (trip) => {
    try {
      const itemsWithIds = trip.items.map(item => ({
        ...item,
        id: Date.now() + Math.random(),
        packed: false
      }));
      
      const tripData = {
        id: trip.id,
        name: trip.name,
        items: itemsWithIds,
        pinnedAt: new Date().toISOString()
      };
      
      localStorage.setItem('pinnedTrip', JSON.stringify(tripData));
      setPinnedTrip(tripData);
      setItems(itemsWithIds);
      setShowTemplateSelector(false);
      setSelectedTemplate(trip.name);
    } catch (error) {
      console.error('Error pinning existing trip:', error);
      setError('Failed to pin trip');
    }
  };

  const clearList = () => {
    setItems([]);
    setSelectedTemplate('');
    if (pinnedTrip) {
      updatePinnedTrip([]);
    }
  };

  const addAdHocItem = async () => {
    if (!newItemName.trim()) return;
    
    const newItem = {
      id: Date.now(),
      name: newItemName,
      packed: false,
      quantity: 1,
      isAdHoc: true
    };
    
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    setNewItemName('');
    setShowAddItem(false);
    if (pinnedTrip) {
      updatePinnedTrip(updatedItems);
    }
  };

  const updateQuantity = (id, delta) => {
    const updatedItems = items.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, (item.quantity || 1) + delta) } : item
    );
    setItems(updatedItems);
    if (pinnedTrip) {
      updatePinnedTrip(updatedItems);
    }
  };

  const deleteItem = (id) => {
    const updatedItems = items.filter(item => item.id !== id);
    setItems(updatedItems);
    if (pinnedTrip) {
      updatePinnedTrip(updatedItems);
    }
  };

  const saveAsTrip = async () => {
    if (!tripName.trim()) return;
    
    try {
      const response = await fetch('/api/packing/trip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: tripName,
          items: items.map(item => ({
            name: item.name,
            quantity: item.quantity || 1
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save trip');
      }

      setTripName('');
      setShowSaveTrip(false);
      setError(null);
      fetchSavedTrips();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteTrip = async (tripId, tripName) => {
    if (!confirm(`Are you sure you want to delete the trip "${tripName}"?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/packing/trip?id=${tripId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete trip');
      }

      fetchSavedTrips();
    } catch (err) {
      setError(err.message);
    }
  };

  const loadPinnedTrip = () => {
    try {
      const saved = localStorage.getItem('pinnedTrip');
      if (saved) {
        const tripData = JSON.parse(saved);
        setPinnedTrip(tripData);
        setItems(tripData.items);
        setSelectedTemplate(tripData.name);
      }
    } catch (error) {
      console.error('Error loading pinned trip:', error);
    }
  };

  const pinCurrentTrip = async () => {
    if (!pinnedTripName.trim()) return;
    
    try {
      // First save the trip to the database
      const response = await fetch('/api/packing/trip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: pinnedTripName,
          items: items.map(item => ({
            name: item.name,
            quantity: item.quantity || 1
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save trip');
      }

      const savedTrip = await response.json();
      
      // Then pin it locally with the database ID
      const tripData = {
        id: savedTrip.id,
        name: pinnedTripName,
        items: items,
        pinnedAt: new Date().toISOString()
      };
      
      localStorage.setItem('pinnedTrip', JSON.stringify(tripData));
      setPinnedTrip(tripData);
      setPinnedTripName('');
      setShowPinTrip(false);
      
      // Refresh saved trips list
      await fetchSavedTrips();
    } catch (error) {
      console.error('Error pinning trip:', error);
      setError('Failed to pin trip');
    }
  };

  const unpinTrip = () => {
    try {
      localStorage.removeItem('pinnedTrip');
      setPinnedTrip(null);
    } catch (error) {
      console.error('Error unpinning trip:', error);
      setError('Failed to unpin trip');
    }
  };

  const updatePinnedTrip = async (newItems) => {
    if (pinnedTrip && pinnedTrip.id) {
      const updatedTrip = {
        ...pinnedTrip,
        items: newItems
      };
      
      try {
        // Update localStorage
        localStorage.setItem('pinnedTrip', JSON.stringify(updatedTrip));
        setPinnedTrip(updatedTrip);
        
        // Update database trip template
        const response = await fetch('/api/packing/trip', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: pinnedTrip.id,
            name: pinnedTrip.name,
            items: newItems.map(item => ({
              name: item.name,
              quantity: item.quantity || 1
            }))
          }),
        });

        if (!response.ok) {
          console.error('Failed to update trip template in database');
        }
      } catch (error) {
        console.error('Error updating pinned trip:', error);
      }
    }
  };

  const packedCount = items.filter(item => item.packed).length;
  const totalCount = items.length;

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ 
          fontSize: '2em', 
          color: '#333',
          margin: 0
        }}>
          Packing List
          {selectedTemplate && (
            <span style={{ 
              fontSize: '0.6em', 
              color: '#495057', 
              marginLeft: '10px',
              fontWeight: 'normal'
            }}>
              ({selectedTemplate.replace('_', ' ')} trip)
            </span>
          )}
          {pinnedTrip && (
            <span style={{ 
              fontSize: '0.5em', 
              color: '#000', 
              marginLeft: '10px',
              fontWeight: 'bold',
              backgroundColor: '#fff3cd',
              padding: '2px 6px',
              borderRadius: '3px',
              border: '1px solid #ffeaa7'
            }}>
              📌 PINNED
            </span>
          )}
        </h1>
        <Link href="/packing/manage" style={{
          padding: '10px 15px',
          backgroundColor: '#007bff',
          color: '#f8f9fa',
          textDecoration: 'none',
          borderRadius: '5px',
          fontSize: '0.9em'
        }}>
          Manage Items
        </Link>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setShowTemplateSelector(!showTemplateSelector)}
          style={{
            padding: '10px 15px',
            backgroundColor: '#28a745',
            color: '#f8f9fa',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '0.9em'
          }}
        >
          Load Template
        </button>
        {totalCount > 0 && (
          <button
            onClick={clearList}
            style={{
              padding: '10px 15px',
              backgroundColor: '#6c757d',
              color: '#f8f9fa',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '0.9em'
            }}
          >
            Clear List
          </button>
        )}
        <button
          onClick={() => setShowAddItem(!showAddItem)}
          style={{
            padding: '10px 15px',
            backgroundColor: '#28a745',
            color: '#f8f9fa',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '0.9em'
          }}
        >
          Add Item
        </button>
        {totalCount > 0 && (
          <button
            onClick={() => setShowSaveTrip(!showSaveTrip)}
            style={{
              padding: '10px 15px',
              backgroundColor: '#dc3545',
              color: '#f8f9fa',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '0.9em'
            }}
          >
            Save as Trip
          </button>
        )}
        {totalCount > 0 && !pinnedTrip && (
          <button
            onClick={() => setShowPinTrip(!showPinTrip)}
            style={{
              padding: '10px 15px',
              backgroundColor: '#ffc107',
              color: '#000',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '0.9em'
            }}
          >
            📌 Pin Trip
          </button>
        )}
        {pinnedTrip && (
          <button
            onClick={unpinTrip}
            style={{
              padding: '10px 15px',
              backgroundColor: '#6c757d',
              color: '#f8f9fa',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '0.9em'
            }}
          >
            Unpin Trip
          </button>
        )}
      </div>

      {showTemplateSelector && (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#000' }}>Select Trip Template</h3>
          
          <h4 style={{ marginBottom: '10px', color: '#000' }}>Standard Templates</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
            {availableTemplates.map(template => (
              <button
                key={template}
                onClick={() => loadTemplate(template)}
                style={{
                  padding: '10px 15px',
                  backgroundColor: '#007bff',
                  color: '#f8f9fa',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '0.9em'
                }}
              >
                {template.replace('_', ' ')}
              </button>
            ))}
          </div>

          {savedTrips.length > 0 && (
            <>
              <h4 style={{ marginBottom: '10px', color: '#000' }}>Saved Trips</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {savedTrips.map(trip => (
                  <div key={trip.id} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <button
                      onClick={() => loadTrip(trip)}
                      style={{
                        padding: '10px 15px',
                        backgroundColor: '#28a745',
                        color: '#f8f9fa',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '0.9em'
                      }}
                    >
                      {trip.name}
                    </button>
                    {(!pinnedTrip || pinnedTrip.id !== trip.id) && (
                      <button
                        onClick={() => pinExistingTrip(trip)}
                        style={{
                          padding: '8px 10px',
                          backgroundColor: '#ffc107',
                          color: '#000',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '0.8em'
                        }}
                        title={`Pin ${trip.name}`}
                      >
                        📌
                      </button>
                    )}
                    {pinnedTrip && pinnedTrip.id === trip.id && (
                      <span style={{
                        padding: '8px 10px',
                        backgroundColor: '#fff3cd',
                        color: '#000',
                        border: '1px solid #ffeaa7',
                        borderRadius: '3px',
                        fontSize: '0.8em',
                        fontWeight: 'bold'
                      }}>
                        PINNED
                      </span>
                    )}
                    <button
                      onClick={() => deleteTrip(trip.id, trip.name)}
                      style={{
                        padding: '8px 10px',
                        backgroundColor: '#dc3545',
                        color: '#f8f9fa',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '0.8em'
                      }}
                      title={`Delete ${trip.name}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {showAddItem && (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#000' }}>Add New Item</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="text"
              placeholder="Item name"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              style={{
                padding: '10px',
                borderRadius: '5px',
                border: '1px solid #ddd',
                fontSize: '0.9em'
              }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={addAdHocItem}
                style={{
                  padding: '10px 15px',
                  backgroundColor: '#007bff',
                  color: '#f8f9fa',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '0.9em'
                }}
              >
                Add Item
              </button>
              <button
                onClick={() => setShowAddItem(false)}
                style={{
                  padding: '10px 15px',
                  backgroundColor: '#6c757d',
                  color: '#f8f9fa',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '0.9em'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showSaveTrip && (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#000' }}>Save as Trip Template</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="text"
              placeholder="Trip name (e.g., 'Vegas 2024')"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              style={{
                padding: '10px',
                borderRadius: '5px',
                border: '1px solid #ddd',
                fontSize: '0.9em'
              }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={saveAsTrip}
                style={{
                  padding: '10px 15px',
                  backgroundColor: '#007bff',
                  color: '#f8f9fa',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '0.9em'
                }}
              >
                Save Trip
              </button>
              <button
                onClick={() => setShowSaveTrip(false)}
                style={{
                  padding: '10px 15px',
                  backgroundColor: '#6c757d',
                  color: '#f8f9fa',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '0.9em'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showPinTrip && (
        <div style={{
          backgroundColor: '#fff3cd',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #ffeaa7'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#000' }}>📌 Pin Current Trip</h3>
          <p style={{ marginBottom: '15px', fontSize: '0.9em', color: '#000' }}>
            Pin this trip to keep it loaded across page visits. Perfect for packing over multiple sessions!
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="text"
              placeholder="Trip name (e.g., 'Weekend Getaway')"
              value={pinnedTripName}
              onChange={(e) => setPinnedTripName(e.target.value)}
              style={{
                padding: '10px',
                borderRadius: '5px',
                border: '1px solid #ddd',
                fontSize: '0.9em'
              }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={pinCurrentTrip}
                style={{
                  padding: '10px 15px',
                  backgroundColor: '#ffc107',
                  color: '#000',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '0.9em'
                }}
              >
                📌 Pin Trip
              </button>
              <button
                onClick={() => setShowPinTrip(false)}
                style={{
                  padding: '10px 15px',
                  backgroundColor: '#6c757d',
                  color: '#f8f9fa',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '0.9em'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {totalCount > 0 && (
        <div style={{
          padding: '15px',
          backgroundColor: '#e9ecef',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <strong style={{ color: '#000' }}>Progress: {packedCount} / {totalCount} items packed</strong>
          <div style={{
            width: '100%',
            height: '10px',
            backgroundColor: '#e9ecef',
            borderRadius: '5px',
            marginTop: '10px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${totalCount > 0 ? (packedCount / totalCount) * 100 : 0}%`,
              height: '100%',
              backgroundColor: '#28a745',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
        </div>
      )}
      
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#000', padding: '40px' }}>
          <h3>Start Your Packing List</h3>
          <p>Begin with a blank list and add items individually, or load a template to get started.</p>
        </div>
      ) : (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '10px'
        }}>
          {items.map((item) => (
            <div 
              key={item.id} 
              style={{
                padding: '15px',
                backgroundColor: item.packed ? '#d4edda' : '#f8f9fa',
                borderRadius: '8px',
                border: `1px solid ${item.packed ? '#c3e6cb' : '#e9ecef'}`,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                opacity: item.packed ? 0.7 : 1
              }}
            >
              <input
                type="checkbox"
                checked={item.packed}
                onChange={() => togglePacked(item.id, item.packed)}
                style={{
                  marginRight: '15px',
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer'
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontSize: '1.1em', 
                  fontWeight: 'bold', 
                  marginBottom: '5px',
                  color: '#333',
                  textDecoration: item.packed ? 'line-through' : 'none'
                }}>
                  {item.name}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    style={{
                      width: '30px',
                      height: '30px',
                      border: '1px solid #ccc',
                      borderRadius: '5px',
                      backgroundColor: '#f8f9fa',
                      color: '#000',
                      cursor: 'pointer',
                      fontSize: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    -
                  </button>
                  <span style={{ 
                    minWidth: '30px', 
                    textAlign: 'center',
                    fontSize: '0.9em',
                    fontWeight: 'bold',
                    color: '#333'
                  }}>
                    {item.quantity || 1}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    style={{
                      width: '30px',
                      height: '30px',
                      border: '1px solid #ccc',
                      borderRadius: '5px',
                      backgroundColor: '#f8f9fa',
                      color: '#000',
                      cursor: 'pointer',
                      fontSize: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    +
                  </button>
                </div>
                {pinnedTrip && (
                  <button
                    onClick={() => deleteItem(item.id)}
                    style={{
                      width: '30px',
                      height: '30px',
                      border: '1px solid #dc3545',
                      borderRadius: '5px',
                      backgroundColor: '#dc3545',
                      color: '#f8f9fa',
                      cursor: 'pointer',
                      fontSize: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Delete item"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}