"use client";
import Link from 'next/link';

export default function ReligionPage() {
  const containerStyle = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '40px 20px',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  };

  const imagePlaceholder = {
    width: '100%',
    minHeight: '200px',
    backgroundColor: '#f0f0f0',
    border: '2px dashed #ccc',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.9rem',
    color: '#666',
    textAlign: 'center',
    padding: '20px',
    marginBottom: '16px'
  };

  return (
    <div style={containerStyle}>
      <header style={{ textAlign: 'center', marginBottom: '48px' }}>
        {/* Header Image Placeholder */}
        <div style={imagePlaceholder}>
          <div>
            <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>🎨 AI Art Placeholder</p>
            <p style={{ margin: 0, fontSize: '0.8rem' }}>
              Replace with: /public/images/stellar-harmony-header.jpg<br/>
              Suggested: Cosmic/celestial themed header image
            </p>
          </div>
        </div>
        
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: '#1a1a1a', marginTop: '24px' }}>
          ⭐ The Order of Stellar Harmony
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#666', fontStyle: 'italic' }}>
          A Fictional Religion for Creative Worldbuilding
        </p>
      </header>
      
      <div style={{ 
        backgroundColor: '#e8f4fd', 
        padding: '24px', 
        borderRadius: '12px',
        marginBottom: '32px',
        border: '2px solid #b3d9ff'
      }}>
        <p style={{ fontSize: '0.9rem', color: '#2c5aa0', margin: 0, textAlign: 'center', fontWeight: '600' }}>
          🎭 FICTIONAL CONTENT - Created for storytelling and worldbuilding purposes
        </p>
      </div>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '600', color: '#2c3e50', marginBottom: '16px' }}>
          Origin Story
        </h2>
        
        {/* Origin Story Image Placeholder */}
        <div style={imagePlaceholder}>
          <div>
            <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>🎨 AI Art Placeholder</p>
            <p style={{ margin: 0, fontSize: '0.8rem' }}>
              Replace with: /public/images/lyra-stellaris-founder.jpg<br/>
              Suggested: Portrait of Lyra Stellaris studying star charts
            </p>
          </div>
        </div>
        
        <div style={{ backgroundColor: '#f8f9fa', padding: '24px', borderRadius: '8px', lineHeight: '1.7' }}>
          <p>Long ago, when the first astronomers gazed upward, they noticed that certain star patterns seemed to pulse in rhythm with human emotions and natural cycles. The founder, Lyra Stellaris, a brilliant mathematician and philosopher, discovered what she called the "Cosmic Resonance" - the idea that consciousness itself creates ripples throughout the universe.</p>
          
          <p>According to legend, Lyra spent seven years mapping these celestial patterns and discovered that when people aligned their actions with specific stellar configurations, they experienced greater harmony, creativity, and connection with others. She documented these findings in the "Codex of Luminous Paths."</p>
        </div>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '600', color: '#2c3e50', marginBottom: '16px' }}>
          Core Tenets
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' }}>
          <div style={{ backgroundColor: '#fff3cd', padding: '24px', borderRadius: '8px' }}>
            <ol style={{ lineHeight: '1.8', paddingLeft: '20px' }}>
              <li><strong>Stellar Reflection:</strong> Every action creates ripples in the cosmic fabric. Consider the far-reaching effects of your choices.</li>
              <li><strong>Luminous Learning:</strong> Knowledge shared multiplies like starlight - the more you teach, the brighter the universe becomes.</li>
              <li><strong>Orbital Balance:</strong> Just as planets maintain stable orbits, seek equilibrium between work, rest, relationships, and solitude.</li>
              <li><strong>Constellation Community:</strong> Individual stars shine brighter when part of a constellation. Support others while maintaining your unique light.</li>
              <li><strong>Cosmic Curiosity:</strong> Wonder and questioning are sacred. The universe rewards those who seek to understand its mysteries.</li>
            </ol>
          </div>
          
          {/* Side Image Placeholder */}
          <div style={{...imagePlaceholder, minHeight: '250px'}}>
            <div>
              <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>🎨 AI Art Placeholder</p>
              <p style={{ margin: 0, fontSize: '0.8rem' }}>
                Replace with: /public/images/cosmic-tenets.jpg<br/>
                Suggested: Abstract cosmic imagery representing the five tenets
              </p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '600', color: '#2c3e50', marginBottom: '16px' }}>
          Sacred Symbol
        </h2>
        
        {/* Sacred Symbol Image Placeholder */}
        <div style={{...imagePlaceholder, maxWidth: '400px', margin: '0 auto 24px auto'}}>
          <div>
            <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>🎨 AI Art Placeholder</p>
            <p style={{ margin: 0, fontSize: '0.8rem' }}>
              Replace with: /public/images/sacred-symbol.jpg<br/>
              Suggested: Artistic rendering of three interconnected stars
            </p>
          </div>
        </div>
        
        <div style={{ textAlign: 'center', padding: '32px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>⭐🌟✨</div>
          <p style={{ fontSize: '1rem', color: '#666', fontStyle: 'italic' }}>
            Three stars representing Past Wisdom, Present Action, and Future Harmony
          </p>
        </div>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '600', color: '#2c3e50', marginBottom: '16px' }}>
          Practices & Rituals
        </h2>
        
        {/* Practices Image Placeholder */}
        <div style={imagePlaceholder}>
          <div>
            <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>🎨 AI Art Placeholder</p>
            <p style={{ margin: 0, fontSize: '0.8rem' }}>
              Replace with: /public/images/stellar-practices.jpg<br/>
              Suggested: People in meditation under starry sky
            </p>
          </div>
        </div>
        
        <div style={{ backgroundColor: '#e8f5e8', padding: '24px', borderRadius: '8px' }}>
          <ul style={{ lineHeight: '1.8', paddingLeft: '20px' }}>
            <li><strong>Dawn Contemplation:</strong> Spend 10 minutes each morning considering how your actions will ripple outward that day.</li>
            <li><strong>Knowledge Gifting:</strong> Weekly practice of teaching someone something new, no matter how small.</li>
            <li><strong>Stellar Sabbath:</strong> One day per month dedicated to rest, reflection, and stargazing (weather permitting).</li>
            <li><strong>Harmony Circles:</strong> Monthly gatherings where practitioners share challenges and collaborate on solutions.</li>
          </ul>
        </div>
      </section>
      
      <div style={{ textAlign: 'center', marginTop: '48px', padding: '24px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3 style={{ color: '#2c3e50', marginBottom: '16px' }}>Ready to Add Your AI Art?</h3>
        <p style={{ color: '#666', fontSize: '0.9rem', lineHeight: '1.6' }}>
          Save your AI-generated images to <code>/public/images/</code> and they'll be accessible at <code>/images/filename.jpg</code><br/>
          Then replace the placeholder divs with: <code>&lt;img src="/images/filename.jpg" alt="description" /&gt;</code>
        </p>
      </div>
      
      <Link href="/home" style={{ 
        display: 'inline-block', 
        marginTop: '20px', 
        color: '#007bff',
        textDecoration: 'none',
        fontSize: '1rem'
      }}>
        ← Back to Home
      </Link>
    </div>
  );
}