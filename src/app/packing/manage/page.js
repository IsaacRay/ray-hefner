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
  const [draggedSavedTrip, setDraggedSavedTrip] = useState(null);
  const [touchStartPos, setTouchStartPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showTemplateLoader, setShowTemplateLoader] = useState(false);
  const [showTripSaver, setShowTripSaver] = useState(false);
  const [showTripPinner, setShowTripPinner] = useState(false);
  const [tripNameToSave, setTripNameToSave] = useState('');
  const [tripNameToPin, setTripNameToPin] = useState('');
  const [currentItems, setCurrentItems] = useState([]);
  const [pinnedTrip, setPinnedTrip] = useState(null);

  const availableTemplates = ['camping', 'beach', 'holidays', 'business', 'road_trip', 'international'];

  useEffect(() => {
    fetchPackingItems();
    fetchSavedTrips();
    loadPinnedTrip();
    loadCurrentItems();

    // Listen for localStorage changes to sync pinned trips
    const handleStorageChange = (e) => {
      if (e.key === 'pinnedTrip') {
        loadPinnedTrip();
        loadCurrentItems();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const loadPinnedTrip = () => {
    try {
      const saved = localStorage.getItem('pinnedTrip');
      if (saved) {
        const tripData = JSON.parse(saved);
        setPinnedTrip(tripData);
        
        // Sort items alphabetically and create active trip from pinned trip
        const sortedItems = (tripData.items || []).sort((a, b) => a.name.localeCompare(b.name));
        const pinnedActiveTrip = {
          id: `pinned-${tripData.id}`,
          name: tripData.name,
          items: sortedItems.map(item => ({ ...item, id: item.id || Date.now() + Math.random() })),
          isActive: true,
          isPinned: true
        };
        
        setActiveTrips(prevTrips => {
          // Check if pinned trip already exists in active trips
          const existingPinnedTrip = prevTrips.find(trip => trip.isPinned);
          if (!existingPinnedTrip) {
            return [pinnedActiveTrip, ...prevTrips];
          }
          // Update existing pinned trip
          return prevTrips.map(trip => 
            trip.isPinned ? pinnedActiveTrip : trip
          );
        });
      } else {
        // Remove pinned trip from active trips if no longer pinned
        setActiveTrips(prevTrips => prevTrips.filter(trip => !trip.isPinned));
      }
    } catch (error) {
      console.error('Error loading pinned trip:', error);
    }
  };

  const loadCurrentItems = () => {
    try {
      const saved = localStorage.getItem('pinnedTrip');
      if (saved) {
        const tripData = JSON.parse(saved);
        setCurrentItems(tripData.items || []);
      }
    } catch (error) {
      console.error('Error loading current items:', error);
    }
  };

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
    setActiveTrips(prevTrips => {
      const updatedTrips = prevTrips.map(trip => {
        if (trip.id === tripId) {
          const newItem = { ...item, id: Date.now() + Math.random() };
          const allItems = [...trip.items, newItem];
          // Sort items alphabetically
          const sortedItems = allItems.sort((a, b) => a.name.localeCompare(b.name));
          const updatedTrip = { ...trip, items: sortedItems };
          
          // If this is a pinned trip, update localStorage, database, and pinned trip state
          if (trip.isPinned && pinnedTrip) {
            const updatedPinnedTrip = {
              ...pinnedTrip,
              items: sortedItems
            };
            
            localStorage.setItem('pinnedTrip', JSON.stringify(updatedPinnedTrip));
            setPinnedTrip(updatedPinnedTrip);
            setCurrentItems(sortedItems);
            
            // Update database trip template
            updateSavedTripInDatabase(updatedPinnedTrip);
            
            // Refresh saved trips list to update item counts
            fetchSavedTrips();
            
            // Dispatch custom event for same-page communication
            window.dispatchEvent(new CustomEvent('pinnedTripUpdated', { 
              detail: updatedPinnedTrip 
            }));
          }
          
          return updatedTrip;
        }
        return trip;
      });
      return updatedTrips;
    });
  };

  const addTemplateToTrip = async (tripId, templateName) => {
    try {
      const response = await fetch(`/api/packing/template?template=${templateName}`);
      if (!response.ok) {
        throw new Error('Failed to load template');
      }
      const templateItems = await response.json();
      
      setActiveTrips(prevTrips => {
        const updatedTrips = prevTrips.map(trip => {
          if (trip.id === tripId) {
            const newItems = templateItems.map(item => ({ ...item, id: Date.now() + Math.random() }));
            const allItems = [...trip.items, ...newItems];
            // Sort items alphabetically
            const sortedItems = allItems.sort((a, b) => a.name.localeCompare(b.name));
            const updatedTrip = { ...trip, items: sortedItems };
            
            // If this is a pinned trip, update localStorage, database, and pinned trip state
            if (trip.isPinned && pinnedTrip) {
              const updatedPinnedTrip = {
                ...pinnedTrip,
                items: sortedItems
              };
              
              localStorage.setItem('pinnedTrip', JSON.stringify(updatedPinnedTrip));
              setPinnedTrip(updatedPinnedTrip);
              setCurrentItems(sortedItems);
              
              // Update database trip template
              updateSavedTripInDatabase(updatedPinnedTrip);
              
              // Dispatch custom event for same-page communication
              window.dispatchEvent(new CustomEvent('pinnedTripUpdated', { 
                detail: updatedPinnedTrip 
              }));
            }
            
            return updatedTrip;
          }
          return trip;
        });
        return updatedTrips;
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const addSavedTripToTrip = (tripId, savedTrip) => {
    setActiveTrips(prevTrips => {
      const updatedTrips = prevTrips.map(trip => {
        if (trip.id === tripId) {
          const newItems = savedTrip.items.map(item => ({ ...item, id: Date.now() + Math.random() }));
          const allItems = [...trip.items, ...newItems];
          // Sort items alphabetically
          const sortedItems = allItems.sort((a, b) => a.name.localeCompare(b.name));
          const updatedTrip = { ...trip, items: sortedItems };
          
          // If this is a pinned trip, update localStorage, database, and pinned trip state
          if (trip.isPinned && pinnedTrip) {
            const updatedPinnedTrip = {
              ...pinnedTrip,
              items: sortedItems
            };
            
            localStorage.setItem('pinnedTrip', JSON.stringify(updatedPinnedTrip));
            setPinnedTrip(updatedPinnedTrip);
            setCurrentItems(sortedItems);
            
            // Update database trip template
            updateSavedTripInDatabase(updatedPinnedTrip);
            
            // Refresh saved trips list to update item counts
            fetchSavedTrips();
            
            // Dispatch custom event for same-page communication
            window.dispatchEvent(new CustomEvent('pinnedTripUpdated', { 
              detail: updatedPinnedTrip 
            }));
          }
          
          return updatedTrip;
        }
        return trip;
      });
      return updatedTrips;
    });
  };

  const convertSavedTripToActiveTrip = async (savedTrip) => {
    const newActiveTrip = {
      id: Date.now(),
      name: savedTrip.name,
      items: savedTrip.items.map(item => ({ ...item, id: Date.now() + Math.random() })),
      isActive: true
    };
    
    setActiveTrips([...activeTrips, newActiveTrip]);
    
    // Also autopin the trip in the main packing list
    try {
      const itemsWithIds = savedTrip.items.map(item => ({
        ...item,
        id: Date.now() + Math.random(),
        packed: false
      }));
      
      const tripData = {
        id: savedTrip.id,
        name: savedTrip.name,
        items: itemsWithIds,
        pinnedAt: new Date().toISOString()
      };
      
      localStorage.setItem('pinnedTrip', JSON.stringify(tripData));
      setPinnedTrip(tripData);
      setCurrentItems(itemsWithIds);
    } catch (error) {
      console.error('Error autopinning trip:', error);
    }
  };

  const loadTemplateToCurrentList = async (template) => {
    try {
      const response = await fetch(`/api/packing/template?template=${template}`);
      if (!response.ok) {
        throw new Error('Failed to load template');
      }
      const data = await response.json();
      setCurrentItems(data);
      setShowTemplateLoader(false);
      
      // Update pinned trip if exists
      if (pinnedTrip) {
        const updatedTrip = {
          ...pinnedTrip,
          items: data
        };
        localStorage.setItem('pinnedTrip', JSON.stringify(updatedTrip));
        setPinnedTrip(updatedTrip);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const loadSavedTripToCurrentList = async (trip) => {
    try {
      const itemsWithIds = trip.items.map(item => ({
        ...item,
        id: Date.now() + Math.random(),
        packed: false
      }));
      setCurrentItems(itemsWithIds);
      setShowTemplateLoader(false);
      
      // Update pinned trip if exists
      if (pinnedTrip) {
        const updatedTrip = {
          ...pinnedTrip,
          items: itemsWithIds
        };
        localStorage.setItem('pinnedTrip', JSON.stringify(updatedTrip));
        setPinnedTrip(updatedTrip);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const saveCurrentListAsTrip = async () => {
    if (!tripNameToSave.trim()) return;
    
    try {
      const response = await fetch('/api/packing/trip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: tripNameToSave,
          items: currentItems.map(item => ({
            name: item.name,
            quantity: item.quantity || 1
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save trip');
      }

      setTripNameToSave('');
      setShowTripSaver(false);
      setError(null);
      fetchSavedTrips();
    } catch (err) {
      setError(err.message);
    }
  };

  const pinCurrentList = async () => {
    if (!tripNameToPin.trim()) return;
    
    try {
      // First save the trip to the database
      const response = await fetch('/api/packing/trip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: tripNameToPin,
          items: currentItems.map(item => ({
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
        name: tripNameToPin,
        items: currentItems,
        pinnedAt: new Date().toISOString()
      };
      
      localStorage.setItem('pinnedTrip', JSON.stringify(tripData));
      setPinnedTrip(tripData);
      setTripNameToPin('');
      setShowTripPinner(false);
      
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
      setCurrentItems([]);
      // Remove pinned trip from active trips
      setActiveTrips(prevTrips => prevTrips.filter(trip => !trip.isPinned));
    } catch (error) {
      console.error('Error unpinning trip:', error);
      setError('Failed to unpin trip');
    }
  };

  const clearCurrentList = () => {
    setCurrentItems([]);
    if (pinnedTrip) {
      const updatedTrip = {
        ...pinnedTrip,
        items: []
      };
      localStorage.setItem('pinnedTrip', JSON.stringify(updatedTrip));
      setPinnedTrip(updatedTrip);
    }
  };

  const deleteSavedTrip = async (tripId, tripName) => {
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

  const updateSavedTripInDatabase = async (tripData) => {
    try {
      const response = await fetch('/api/packing/trip', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: tripData.id,
          name: tripData.name,
          items: tripData.items.map(item => ({
            name: item.name,
            quantity: item.quantity || 1
          }))
        }),
      });

      if (!response.ok) {
        console.error('Failed to update trip template in database');
      }
    } catch (error) {
      console.error('Error updating saved trip in database:', error);
    }
  };

  const handleDragStart = (e, item, type) => {
    if (type === 'item') {
      setDraggedItem(item);
      e.dataTransfer.effectAllowed = 'copy';
    } else if (type === 'template') {
      setDraggedTemplate(item);
      e.dataTransfer.effectAllowed = 'copy';
    } else if (type === 'savedTrip') {
      setDraggedSavedTrip(item);
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
    } else if (type === 'savedTrip') {
      setDraggedSavedTrip(item);
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
    
    // Find the closest trip container or active trips section
    let tripContainer = elementBelow;
    while (tripContainer && !tripContainer.dataset.tripId && !tripContainer.dataset.dropZone) {
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
      } else if (draggedSavedTrip) {
        addSavedTripToTrip(tripId, draggedSavedTrip);
        setDraggedSavedTrip(null);
      }
    } else if (tripContainer && tripContainer.dataset.dropZone === 'active-trips') {
      // Handle drop onto Active Trips section
      if (draggedSavedTrip) {
        convertSavedTripToActiveTrip(draggedSavedTrip);
        setDraggedSavedTrip(null);
      }
    }
    
    setIsDragging(false);
    setDraggedItem(null);
    setDraggedTemplate(null);
    setDraggedSavedTrip(null);
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
    } else if (draggedSavedTrip) {
      addSavedTripToTrip(tripId, draggedSavedTrip);
      setDraggedSavedTrip(null);
    }
  };

  const handleDropToActiveTrips = (e) => {
    e.preventDefault();
    
    if (draggedSavedTrip) {
      convertSavedTripToActiveTrip(draggedSavedTrip);
      setDraggedSavedTrip(null);
    }
  };

  const removeItemFromTrip = (tripId, itemId) => {
    setActiveTrips(prevTrips => {
      const updatedTrips = prevTrips.map(trip => {
        if (trip.id === tripId) {
          const filteredItems = trip.items.filter(item => item.id !== itemId);
          // Sort items alphabetically (though removing doesn't change order)
          const sortedItems = filteredItems.sort((a, b) => a.name.localeCompare(b.name));
          const updatedTrip = { ...trip, items: sortedItems };
          
          // If this is a pinned trip, update localStorage, database, and pinned trip state
          if (trip.isPinned && pinnedTrip) {
            const updatedPinnedTrip = {
              ...pinnedTrip,
              items: sortedItems
            };
            
            localStorage.setItem('pinnedTrip', JSON.stringify(updatedPinnedTrip));
            setPinnedTrip(updatedPinnedTrip);
            setCurrentItems(sortedItems);
            
            // Update database trip template
            updateSavedTripInDatabase(updatedPinnedTrip);
            
            // Refresh saved trips list to update item counts
            fetchSavedTrips();
            
            // Dispatch custom event for same-page communication
            window.dispatchEvent(new CustomEvent('pinnedTripUpdated', { 
              detail: updatedPinnedTrip 
            }));
          }
          
          return updatedTrip;
        }
        return trip;
      });
      return updatedTrips;
    });
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
          color: '#000',
          margin: 0
        }}>
          Trip Planning & Item Management
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
              📌 PINNED: {pinnedTrip.name}
            </span>
          )}
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
          <h2 style={{ fontSize: '1.5em', marginBottom: '20px', color: '#000' }}>Items & Templates</h2>
          
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
            <h3 style={{ fontSize: '1.2em', marginBottom: '15px', color: '#000' }}>Standard Templates</h3>
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
                  <span style={{ fontWeight: 'bold', "color":"black" }}>{template.replace('_', ' ')}</span>
                  <span style={{ fontSize: '0.9em', color: '#000' }}>📦 Template</span>
                </div>
              ))}
            </div>
          </div>

          {/* Saved Trips */}
          {savedTrips.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '1.2em', marginBottom: '15px', color: '#000' }}>Saved Trips</h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                {savedTrips.map(trip => (
                  <div
                    key={trip.id}
                    style={{
                      padding: '15px',
                      backgroundColor: '#e8f5e8',
                      borderRadius: '8px',
                      border: '2px solid #4caf50',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      opacity: isDragging && (draggedSavedTrip?.id === trip.id) ? 0.5 : 1
                    }}
                  >
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, trip, 'savedTrip')}
                      onTouchStart={(e) => handleTouchStart(e, trip, 'savedTrip')}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      style={{
                        cursor: 'grab',
                        touchAction: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        flex: 1
                      }}
                    >
                      <span style={{ fontWeight: 'bold', "color":"black" }}>{trip.name}</span>
                      <span style={{ fontSize: '0.9em', color: '#000' }}>💾 Saved ({trip.items.length} items)</span>
                    </div>
                    <button
                      onClick={() => deleteSavedTrip(trip.id, trip.name)}
                      style={{
                        padding: '8px 10px',
                        backgroundColor: '#dc3545',
                        color: '#f8f9fa',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8em',
                        marginLeft: '10px'
                      }}
                      title={`Delete ${trip.name}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Individual Items */}
          <div>
            <h3 style={{ fontSize: '1.2em', marginBottom: '15px', color: '#000' }}>Individual Items</h3>
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
                  <span style={{ fontWeight: 'bold', "color":"black" }}>{item.name}</span>
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
          <h2 style={{ fontSize: '1.5em', marginBottom: '20px', color: '#000' }}>Active Trips</h2>
          
          {activeTrips.length === 0 ? (
            <div 
              data-drop-zone="active-trips"
              onDragOver={handleDragOver}
              onDrop={handleDropToActiveTrips}
              style={{ 
                textAlign: 'center', 
                color: '#000', 
                padding: '40px',
                border: isDragging && draggedSavedTrip ? '2px dashed #28a745' : '2px dashed #ccc',
                borderRadius: '8px',
                backgroundColor: isDragging && draggedSavedTrip ? '#e8f5e8' : 'transparent',
                transition: 'all 0.2s ease'
              }}
            >
              <h3>No Active Trips</h3>
              <p>Create a new trip to start planning!</p>
              <p style={{ fontSize: '0.9em', color: '#000', marginTop: '10px' }}>
                💡 Drag a saved trip here to convert it to an active trip and auto-pin it!
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              {/* Drop zone for creating new active trips */}
              <div 
                data-drop-zone="active-trips"
                onDragOver={handleDragOver}
                onDrop={handleDropToActiveTrips}
                style={{ 
                  textAlign: 'center', 
                  color: '#000', 
                  padding: '20px',
                  border: isDragging && draggedSavedTrip ? '2px dashed #28a745' : '2px dashed #ccc',
                  borderRadius: '8px',
                  backgroundColor: isDragging && draggedSavedTrip ? '#e8f5e8' : '#f8f9fa',
                  transition: 'all 0.2s ease',
                  fontSize: '0.9em'
                }}
              >
                <span style={{ color: '#000' }}>
                  💡 Drag a saved trip here to create a new active trip and auto-pin it!
                </span>
              </div>
              
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h3 style={{ margin: 0, color: '#000' }}>{trip.name}</h3>
                      {trip.isPinned && (
                        <span style={{ 
                          fontSize: '0.8em', 
                          color: '#000', 
                          fontWeight: 'bold',
                          backgroundColor: '#fff3cd',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          border: '1px solid #ffeaa7'
                        }}>
                          📌 PINNED
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {!trip.isPinned && (
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
                      )}
                      {trip.isPinned ? (
                        <button
                          onClick={unpinTrip}
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
                          Unpin
                        </button>
                      ) : (
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
                      )}
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
                        color: '#000',
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
                            <span style={{"color":"black"}}>{item.name}</span>
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
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#000' }}>
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#000' }}>
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
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#000' }}>
                Trip Templates
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {availableTemplates.map(template => (
                  <label key={template} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#000' }}>
                    <input
                      type="checkbox"
                      checked={formData.templates.includes(template)}
                      onChange={() => handleTemplateChange(template)}
                      style={{ marginRight: '5px' }}
                    />
                    <span style={{ 
                      padding: '5px 10px',
                      backgroundColor: formData.templates.includes(template) ? '#007bff' : '#f8f9fa',
                      color: formData.templates.includes(template) ? 'white' : '#000',
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