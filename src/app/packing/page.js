"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PackingPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [pinnedTrip, setPinnedTrip] = useState(null);

  useEffect(() => {
    const initializePage = async () => {
      try {
        loadPinnedTrip();
      } catch (error) {
        console.error('Error initializing page:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initializePage();

    // Listen for localStorage changes to sync with manage page
    const handleStorageChange = (e) => {
      if (e.key === 'pinnedTrip') {
        loadPinnedTrip();
      }
    };

    // Listen for custom events for same-page communication
    const handlePinnedTripUpdate = (e) => {
      const updatedTrip = e.detail;
      setPinnedTrip(updatedTrip);
      setItems(updatedTrip.items);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('pinnedTripUpdated', handlePinnedTripUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('pinnedTripUpdated', handlePinnedTripUpdate);
    };
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
      // Sort items alphabetically
      const sortedItems = updatedItems.sort((a, b) => a.name.localeCompare(b.name));
      setItems(sortedItems);
      if (pinnedTrip) {
        updatePinnedTrip(sortedItems);
      }
    } catch (err) {
      setError(err.message);
    }
  };


  const addAdHocItem = async () => {
    if (!newItemName.trim()) return;
    
    try {
      // Always save the item to the database permanently
      const templates = [];
      
      
      const response = await fetch('/api/packing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newItemName,
          templates: templates
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save item');
      }

      const data = await response.json();
      const newItem = {
        ...data,
        quantity: 1,
        packed: false
      };
      
      const updatedItems = [...items, newItem];
      // Sort items alphabetically
      const sortedItems = updatedItems.sort((a, b) => a.name.localeCompare(b.name));
      setItems(sortedItems);
      setNewItemName('');
      setShowAddItem(false);
      
      if (pinnedTrip) {
        updatePinnedTrip(sortedItems);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const updateQuantity = (id, delta) => {
    const updatedItems = items.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, (item.quantity || 1) + delta) } : item
    );
    // Sort items alphabetically
    const sortedItems = updatedItems.sort((a, b) => a.name.localeCompare(b.name));
    setItems(sortedItems);
    if (pinnedTrip) {
      updatePinnedTrip(sortedItems);
    }
  };

  const deleteItem = (id) => {
    const updatedItems = items.filter(item => item.id !== id);
    // Sort items alphabetically (though removing doesn't change order)
    const sortedItems = updatedItems.sort((a, b) => a.name.localeCompare(b.name));
    setItems(sortedItems);
    if (pinnedTrip) {
      updatePinnedTrip(sortedItems);
    }
  };


  const loadPinnedTrip = () => {
    try {
      const saved = localStorage.getItem('pinnedTrip');
      if (saved) {
        const tripData = JSON.parse(saved);
        // Sort items alphabetically when loading
        const sortedItems = (tripData.items || []).sort((a, b) => a.name.localeCompare(b.name));
        const sortedTripData = { ...tripData, items: sortedItems };
        setPinnedTrip(sortedTripData);
        setItems(sortedItems);
      }
    } catch (error) {
      console.error('Error loading pinned trip:', error);
    }
  };


  const unpinTrip = () => {
    try {
      localStorage.removeItem('pinnedTrip');
      setPinnedTrip(null);
      setItems([]);
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
        
        // Dispatch custom event for same-page communication
        window.dispatchEvent(new CustomEvent('pinnedTripUpdated', { 
          detail: updatedTrip 
        }));
        
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


      {/* Active Trip Display */}
      {pinnedTrip && (
        <div 
          style={{
            marginBottom: '20px',
            padding: '20px',
            border: '2px solid #ffc107',
            borderRadius: '8px',
            backgroundColor: '#fff3cd'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.2em', fontWeight: 'bold', "color":"black" }}>📌 Active Trip:</span>
              <span style={{ fontSize: '1.2em', fontWeight: 'bold', "color":"black" }}>
                {pinnedTrip.name}
              </span>
            </div>
            <button
              onClick={unpinTrip}
              style={{
                padding: '8px 12px',
                backgroundColor: '#dc3545',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9em'
              }}
            >
              Unpin
            </button>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
        {pinnedTrip && (
          <button
            onClick={unpinTrip}
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
            Unpin Trip
          </button>
        )}
      </div>


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
          <p>Add items to get started, or visit the manage page to load templates and create trips.</p>
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