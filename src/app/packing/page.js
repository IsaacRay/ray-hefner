"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PackingPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');

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

  const togglePacked = async (id, currentStatus) => {
    try {
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

      setItems(items.map(item => 
        item.id === id ? { ...item, packed: !currentStatus } : item
      ));
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
    } catch (err) {
      setError(err.message);
    }
  };

  const clearList = () => {
    setItems([]);
    setSelectedTemplate('');
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
              color: '#6c757d', 
              marginLeft: '10px',
              fontWeight: 'normal'
            }}>
              ({selectedTemplate.replace('_', ' ')} trip)
            </span>
          )}
        </h1>
        <Link href="/packing/manage" style={{
          padding: '10px 15px',
          backgroundColor: '#007bff',
          color: 'white',
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
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '0.9em'
          }}
        >
          Load Template
        </button>
        <button
          onClick={() => fetchPackingItems()}
          style={{
            padding: '10px 15px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '0.9em'
          }}
        >
          Load All Items
        </button>
        {totalCount > 0 && (
          <button
            onClick={clearList}
            style={{
              padding: '10px 15px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '0.9em'
            }}
          >
            Clear List
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
          <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Select Trip Template</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {availableTemplates.map(template => (
              <button
                key={template}
                onClick={() => loadTemplate(template)}
                style={{
                  padding: '10px 15px',
                  backgroundColor: '#007bff',
                  color: 'white',
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
          <strong>Progress: {packedCount} / {totalCount} items packed</strong>
          <div style={{
            width: '100%',
            height: '10px',
            backgroundColor: '#fff',
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
        <p style={{ textAlign: 'center', color: '#666' }}>
          No packing items found.
        </p>
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
                {item.description && (
                  <div style={{ 
                    fontSize: '0.9em', 
                    color: '#666' 
                  }}>
                    {item.description}
                  </div>
                )}
                {item.category && (
                  <div style={{ 
                    fontSize: '0.8em', 
                    color: '#007bff',
                    marginTop: '5px',
                    fontWeight: '500'
                  }}>
                    {item.category}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}