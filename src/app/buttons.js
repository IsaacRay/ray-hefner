"use client"

import axios from "axios";
import Button from 'react-bootstrap/Button';

import 'bootstrap/dist/css/bootstrap.min.css';
import { useState, useEffect } from "react";

// Custom Alert Component
function CustomAlert({ message, type, onClose }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose();
      }, 500); // Animation duration
    }, 4500); // Start fade after 4.5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!isVisible) return null;

  const alertStyle = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    maxWidth: '300px',
    padding: '16px 20px',
    borderRadius: '8px',
    backgroundColor: type === 'success' ? '#d4edda' : '#f8d7da',
    color: type === 'success' ? '#155724' : '#721c24',
    border: `1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 9999,
    transition: 'opacity 0.5s ease, transform 0.5s ease',
    opacity: isAnimating ? 0 : 1,
    transform: isAnimating ? 'translateX(100%)' : 'translateX(0)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '14px',
    fontWeight: '500'
  };

  return (
    <div style={alertStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{message}</span>
        <button
          onClick={() => {
            setIsAnimating(true);
            setTimeout(() => {
              setIsVisible(false);
              onClose();
            }, 500);
          }}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            marginLeft: '10px',
            color: 'inherit',
            opacity: 0.7,
            padding: '0'
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

// Alert Manager
let alertCounter = 0;
let setGlobalAlerts = null;

export function AlertProvider({ children }) {
  const [alerts, setAlerts] = useState([]);
  
  useEffect(() => {
    setGlobalAlerts = setAlerts;
  }, []);

  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  return (
    <>
      {children}
      {alerts.map(alert => (
        <CustomAlert
          key={alert.id}
          message={alert.message}
          type={alert.type}
          onClose={() => removeAlert(alert.id)}
        />
      ))}
    </>
  );
}

function showAlert(message, type = 'success') {
  if (setGlobalAlerts) {
    const id = ++alertCounter;
    setGlobalAlerts(prev => [...prev, { id, message, type }]);
  }
}

export function IsaacGarage() {
  return <Button variant="danger" onClick={() => garage("isaac")}>🚗 Isaac Garage</Button>;
}

export function KathrynGarage() {
    return <Button variant="danger" onClick={() => garage("kathryn")}>🚙 Kathryn Garage</Button>;
  }

export function FamilyRoomLight() {
    return <Button variant="primary" onClick={() => webhook("family_room_light")}>💡 Family Room Light</Button>;
  }

  export function Logging() {
    const [textFieldValue, setTextFieldValue] = useState('');
    
    const handleLogClick = () => {
      webhook("logging", `${textFieldValue}`);
      setTextFieldValue(''); // Clear the text field after logging
    };
    
    return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
    <input 
      type="text" 
      id="logging" 
      value={textFieldValue} 
      onChange={(e) => setTextFieldValue(e.target.value)}
      placeholder="Custom command..."
      style={{ 
        padding: '8px 12px', 
        borderRadius: '4px', 
        border: '1px solid #ccc',
        fontSize: '14px'
      }}
    />
    <Button variant="info" onClick={handleLogClick}>📝 Log</Button>
    </div>
    )
  }

  export function OtherGroceries() {
    const [textFieldValue, setTextFieldValue] = useState('');
    return (
    <>
    <input type="text" id="other" value={textFieldValue} onChange={(e) => setTextFieldValue(e.target.value)}></input>
    <Button variant="info" onClick={() => webhook("groceries", `${textFieldValue}`)}>Other</Button>
    </>
    )
  }

  

  export function Strawberries() {
    return <Button variant="primary" onClick={() => webhook("groceries", "strawberries")}>Strawberries</Button>;
  }

  export function Yogurts() {
    return <Button variant="primary" onClick={() => webhook("groceries", "chobani yogurts")}>Yogurts</Button>;
  }

export function Sausages() { 
  return <Button variant="primary" onClick={() => webhook("groceries", "sausages")}>Sausages</Button>;
} 

export function Pepperoni() {
  return <Button variant="primary" onClick={() => webhook("groceries", "pepperoni")}>Pepperoni</Button>;
}

export function BabyBell() {
  return <Button variant="primary" onClick={() => webhook("groceries", "babybell")}>Baby Bell</Button>;
}

export function StringCheese() {
  return <Button variant="primary" onClick={() => webhook("groceries", "string cheese")}>String Cheese</Button>;
}

export function GranolaBars() {
  return <Button variant="primary" onClick={() => webhook("groceries", "granola bars")}>Granola Bars</Button>;
}

export function Milk() { 
  return <Button variant="primary" onClick={() => webhook("groceries", "milk")}>Milk</Button>;
}





function garage(whose) {
    axios.get('https://api.ray-hefner.com/'+whose)
      .then((response) => {
        showAlert("Garage button clicked", "success")
      }).catch((error) => { showAlert("Garage button clicked", "success") });
  }


  function webhook(event, value){
    if (value){
      axios.get('https://maker.ifttt.com/trigger/'+event+'/with/key/c_0ufFFhyJW6OHzYqgzwP4?value1='+value)
      .then((response) => {
        showAlert("Button clicked", "success");
      }).catch((error) => { showAlert("Button clicked", "success") });
    } else {
    axios.get('https://maker.ifttt.com/trigger/'+event+'/with/key/c_0ufFFhyJW6OHzYqgzwP4')
      .then((response) => {
        showAlert("Button clicked", "success");
      }).catch((error) => { showAlert("Button clicked", "success") });
  }
}



  