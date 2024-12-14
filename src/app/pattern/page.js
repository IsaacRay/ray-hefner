
"use client"
import { useEffect, useRef, useState } from 'react';

export default function PatternAuthentication() {
  const patternContainerRef = useRef(null);
  const canvasRef = useRef(null);
  const [dots, setDots] = useState([]);
  const [pattern, setPattern] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastDot, setLastDot] = useState(null);
  const [message, setMessage] = useState(''); // State for the message

  // Define the correct pattern (sequence of indices)
  const correctPattern = [3,6,7,8]; // Example pattern

  useEffect(() => {
    const initializeDots = () => {
      const tempDots = [];
      for (let i = 0; i < 9; i++) {
        tempDots.push({ index: i, active: false });
      }
      setDots(tempDots);
    };

    initializeDots();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 5;
  }, []);

  useEffect(() => {
    // Attach global event listeners for mouseup and touchend
    const handleGlobalMouseUp = () => {
      if (isDrawing) {
        handleEnd();
      }
    };

    const handleGlobalTouchEnd = () => {
      if (isDrawing) {
        handleEnd();
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalTouchEnd);

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isDrawing, pattern]);

  const getDotPosition = (dotElement) => {
    const rect = dotElement.getBoundingClientRect();
    const containerRect = patternContainerRef.current.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2 - containerRect.left,
      y: rect.top + rect.height / 2 - containerRect.top,
    };
  };

  const drawLine = (from, to) => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const clearCanvas = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const handleStart = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    setPattern([]);
    clearCanvas();
    setMessage(''); // Clear any existing message

    const pos = getEventPosition(e);
    const dot = getDotAtPosition(pos);
    if (dot !== null) {
      activateDot(dot);
    }
  };

  const handleMove = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getEventPosition(e);
    const dot = getDotAtPosition(pos);
    if (dot && !pattern.includes(dot.index)) {
      activateDot(dot);
      if (lastDot !== null) {
        const from = getDotPosition(
          patternContainerRef.current.querySelector(`.dot[data-index="${lastDot}"]`)
        );
        const to = getDotPosition(
          patternContainerRef.current.querySelector(`.dot[data-index="${dot.index}"]`)
        );
        drawLine(from, to);
      }
    }
  };

  const handleEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (pattern.length > 0) {
      verifyPattern();
    }
  };

  const activateDot = (dot) => {
    setDots((prevDots) =>
      prevDots.map((d) =>
        d.index === dot.index ? { ...d, active: true } : d
      )
    );
    setPattern((prevPattern) => [...prevPattern, dot.index]);
    setLastDot(dot.index);
  };

  const getEventPosition = (e) => {
    const rect = patternContainerRef.current.getBoundingClientRect();
    if (e.touches) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const getDotAtPosition = (pos) => {
    const dotElements = patternContainerRef.current.querySelectorAll('.dot');
    for (let dotElement of dotElements) {
      const dotPos = getDotPosition(dotElement);
      const dx = pos.x - dotPos.x;
      const dy = pos.y - dotPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= 20) {
        return { index: parseInt(dotElement.dataset.index) };
      }
    }
    return null;
  };

  const verifyPattern = () => {
    if (arraysEqual(pattern, correctPattern)) {
      window.location.href = '/?p=kice'; // Redirect to the home page
    } else {
      setMessage('Incorrect Pattern. Try again.');
      setTimeout(resetPattern, 1000);
    }
  };

  const resetPattern = () => {
    clearCanvas();
    setPattern([]);
    setLastDot(null);
    setDots((prevDots) =>
      prevDots.map((d) => ({ ...d, active: false }))
    );
    setMessage(''); // Clear the message after reset
  };

  const arraysEqual = (a, b) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  };

  return (
    <div className="container">
      <div className="pattern-wrapper">
        <div
          id="pattern-container"
          ref={patternContainerRef}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          // Removed onMouseUp and onTouchEnd from here
        >
          {dots.map((dot) => (
            <div
              key={dot.index}
              className={`dot ${dot.active ? 'active' : ''}`}
              data-index={dot.index}
            ></div>
          ))}
        </div>
        <canvas id="canvas" ref={canvasRef} width="300" height="300"></canvas>
        <div id="message">{message}</div> {/* Display message from state */}
      </div>

      <style jsx>{`
        .container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background-color: #2c3e50;
        }
        .pattern-wrapper {
          position: relative;
        }
        #pattern-container {
          position: relative;
          width: 300px;
          height: 300px;
          display: grid;
          grid-template: repeat(3, 1fr) / repeat(3, 1fr);
          gap: 50px;
          touch-action: none; /* Prevent default touch behaviors */
        }
        .dot {
          width: 20px;
          height: 20px;
          background-color: #bdc3c7;
          border-radius: 50%;
          position: relative;
          z-index: 2;
          transition: background-color 0.3s;
        }
        .dot.active {
          background-color: #3498db;
        }
        #canvas {
          position: absolute;
          top: 0;
          left: 0;
          z-index: 1;
        }
        #message {
          position: absolute;
          top: 320px;
          text-align: center;
          color: #ecf0f1;
          width: 100%;
          font-size: 18px;
          font-weight: bold;
        }
        @media (max-width: 400px) {
          #pattern-container {
            width: 250px;
            height: 250px;
            gap: 40px;
          }
          #canvas {
            width: 250px;
            height: 250px;
          }
          .dot {
            width: 18px;
            height: 18px;
          }
          #message {
            top: 280px;
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
}
