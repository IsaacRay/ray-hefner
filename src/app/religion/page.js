"use client";
import Link from 'next/link';

export default function ReligionPage() {
  const containerStyle = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '40px 20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    minHeight: '100vh',
    backgroundImage: 'url(/public/image.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    position: 'relative'
  };

  const overlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(13, 25, 45, 0.85)',
    zIndex: 1
  };

  const contentStyle = {
    position: 'relative',
    zIndex: 2,
    color: '#e6f2ff'
  };


  return (
    <div style={containerStyle}>
      <div style={overlayStyle}></div>
      <div style={contentStyle}>
      <header style={{ textAlign: 'center', marginBottom: '48px' }}>
        
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: '#f4d03f', marginTop: '24px', textShadow: '2px 2px 4px rgba(0,0,0,0.7)' }}>
          The Order of Stellar Harmony
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#a8c8ec', fontStyle: 'italic' }}>
          A Fictional Religion for Creative Worldbuilding
        </p>
      </header>
      
      <div style={{ 
        backgroundColor: 'rgba(30, 58, 97, 0.8)', 
        padding: '24px', 
        borderRadius: '12px',
        marginBottom: '32px',
        border: '2px solid #4a90e2',
        backdropFilter: 'blur(5px)'
      }}>
        <p style={{ fontSize: '0.9rem', color: '#a8c8ec', margin: 0, textAlign: 'center', fontWeight: '600' }}>
          FICTIONAL CONTENT - Created for storytelling and worldbuilding purposes
        </p>
      </div>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '600', color: '#f4d03f', marginBottom: '16px', textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
          Origin Story
        </h2>
        
        
        <div style={{ backgroundColor: 'rgba(35, 67, 107, 0.7)', padding: '24px', borderRadius: '8px', lineHeight: '1.7', backdropFilter: 'blur(5px)', border: '1px solid rgba(244, 208, 63, 0.3)' }}>
          <p>Long ago, when the first astronomers gazed upward, they noticed that certain star patterns seemed to pulse in rhythm with human emotions and natural cycles. The founder, Lyra Stellaris, a brilliant mathematician and philosopher, discovered what she called the "Cosmic Resonance" - the idea that consciousness itself creates ripples throughout the universe.</p>
          
          <p>According to legend, Lyra spent seven years mapping these celestial patterns and discovered that when people aligned their actions with specific stellar configurations, they experienced greater harmony, creativity, and connection with others. She documented these findings in the "Codex of Luminous Paths."</p>
        </div>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '600', color: '#f4d03f', marginBottom: '16px', textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
          Core Tenets
        </h2>
        
        <div style={{ backgroundColor: 'rgba(35, 67, 107, 0.7)', padding: '24px', borderRadius: '8px', backdropFilter: 'blur(5px)', border: '1px solid rgba(244, 208, 63, 0.3)' }}>
          <ol style={{ lineHeight: '1.8', paddingLeft: '20px' }}>
            <li><strong>Stellar Reflection:</strong> Every action creates ripples in the cosmic fabric. Consider the far-reaching effects of your choices.</li>
            <li><strong>Luminous Learning:</strong> Knowledge shared multiplies like starlight - the more you teach, the brighter the universe becomes.</li>
            <li><strong>Orbital Balance:</strong> Just as planets maintain stable orbits, seek equilibrium between work, rest, relationships, and solitude.</li>
            <li><strong>Constellation Community:</strong> Individual stars shine brighter when part of a constellation. Support others while maintaining your unique light.</li>
            <li><strong>Cosmic Curiosity:</strong> Wonder and questioning are sacred. The universe rewards those who seek to understand its mysteries.</li>
          </ol>
        </div>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '600', color: '#f4d03f', marginBottom: '16px', textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
          Sacred Symbol
        </h2>
        
        
        <div style={{ textAlign: 'center', padding: '32px', backgroundColor: 'rgba(35, 67, 107, 0.7)', borderRadius: '8px', backdropFilter: 'blur(5px)', border: '1px solid rgba(244, 208, 63, 0.3)' }}>
          <p style={{ fontSize: '1rem', color: '#a8c8ec', fontStyle: 'italic' }}>
            Three stars representing Past Wisdom, Present Action, and Future Harmony
          </p>
        </div>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '600', color: '#f4d03f', marginBottom: '16px', textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
          Practices & Rituals
        </h2>
        
        
        <div style={{ backgroundColor: 'rgba(35, 67, 107, 0.7)', padding: '24px', borderRadius: '8px', backdropFilter: 'blur(5px)', border: '1px solid rgba(244, 208, 63, 0.3)' }}>
          <ul style={{ lineHeight: '1.8', paddingLeft: '20px' }}>
            <li><strong>Dawn Contemplation:</strong> Spend 10 minutes each morning considering how your actions will ripple outward that day.</li>
            <li><strong>Knowledge Gifting:</strong> Weekly practice of teaching someone something new, no matter how small.</li>
            <li><strong>Stellar Sabbath:</strong> One day per month dedicated to rest, reflection, and stargazing (weather permitting).</li>
            <li><strong>Harmony Circles:</strong> Monthly gatherings where practitioners share challenges and collaborate on solutions.</li>
          </ul>
        </div>
      </section>
      
      
      <Link href="/home" style={{ 
        display: 'inline-block', 
        marginTop: '20px', 
        color: '#4a90e2',
        textDecoration: 'none',
        fontSize: '1rem'
      }}>
        ← Back to Home
      </Link>
      </div>
    </div>
  );
}