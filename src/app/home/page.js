
"use client";
import { useRouter } from 'next/navigation';
import {ColtonDemerit, ColtonStar, FamilyRoomLight, IsaacGarage, KathrynGarage, Logging} from "../buttons";
import Link from 'next/link';

export default function Home() {
  const router = useRouter();

  const buttonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '500',
    border: '2px solid #007bff',
    borderRadius: '8px',
    backgroundColor: '#007bff',
    color: 'white',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '200px',
    fontFamily: 'inherit'
  };

  const buttonHoverStyle = {
    backgroundColor: '#0056b3',
    borderColor: '#0056b3',
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)'
  };

  const containerStyle = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '40px 20px',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '48px'
  };

  const titleStyle = {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: '12px'
  };

  const subtitleStyle = {
    fontSize: '1.1rem',
    color: '#666',
    fontWeight: '400'
  };

  const sectionStyle = {
    marginBottom: '40px'
  };

  const sectionTitleStyle = {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#333',
    marginBottom: '20px',
    textAlign: 'center'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '32px'
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>🏠 Home Control Center</h1>
        <p style={subtitleStyle}>Manage your smart home and family activities</p>
      </header>

      {/* Smart Home Controls */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>🏡 Smart Home Controls</h2>
        <div style={gridStyle}>
          <IsaacGarage />
          <KathrynGarage />
          <FamilyRoomLight />
          <Logging />
        </div>
      </section>

      {/* Family Management */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>👨‍👩‍👧‍👦 Family Management</h2>
        <div style={gridStyle}>
          <Link href="/groceries" style={buttonStyle}
                onMouseEnter={(e) => Object.assign(e.target.style, buttonHoverStyle)}
                onMouseLeave={(e) => Object.assign(e.target.style, buttonStyle)}>
            🛒 Groceries
          </Link>
          
          <Link href="/behavior" style={buttonStyle}
                onMouseEnter={(e) => Object.assign(e.target.style, buttonHoverStyle)}
                onMouseLeave={(e) => Object.assign(e.target.style, buttonStyle)}>
            ⭐ Behavior Tracking
          </Link>
          
          <Link href="/tasks" style={buttonStyle}
                onMouseEnter={(e) => Object.assign(e.target.style, buttonHoverStyle)}
                onMouseLeave={(e) => Object.assign(e.target.style, buttonStyle)}>
            ✅ Tasks
          </Link>
          
          <Link href="/calendar" style={buttonStyle}
                onMouseEnter={(e) => Object.assign(e.target.style, buttonHoverStyle)}
                onMouseLeave={(e) => Object.assign(e.target.style, buttonStyle)}>
            📅 Calendar
          </Link>
        </div>
      </section>

      {/* Additional Features */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>🔧 Additional Features</h2>
        <div style={gridStyle}>
          <Link href="/manage-behaviors" style={buttonStyle}
                onMouseEnter={(e) => Object.assign(e.target.style, buttonHoverStyle)}
                onMouseLeave={(e) => Object.assign(e.target.style, buttonStyle)}>
            ⚙️ Manage Behaviors
          </Link>
          
          <Link href="/madison" style={buttonStyle}
                onMouseEnter={(e) => Object.assign(e.target.style, buttonHoverStyle)}
                onMouseLeave={(e) => Object.assign(e.target.style, buttonStyle)}>
            🗳️ Madison Voting
          </Link>
          
          <Link href="/squares" style={buttonStyle}
                onMouseEnter={(e) => Object.assign(e.target.style, buttonHoverStyle)}
                onMouseLeave={(e) => Object.assign(e.target.style, buttonStyle)}>
            🏈 Squares Pool
          </Link>
          
          <Link href="/allowance" style={buttonStyle}
                onMouseEnter={(e) => Object.assign(e.target.style, buttonHoverStyle)}
                onMouseLeave={(e) => Object.assign(e.target.style, buttonStyle)}>
            💰 Allowance
          </Link>
          
          <Link href="/packing" style={buttonStyle}
                onMouseEnter={(e) => Object.assign(e.target.style, buttonHoverStyle)}
                onMouseLeave={(e) => Object.assign(e.target.style, buttonStyle)}>
            🧳 Packing
          </Link>
        </div>
      </section>
    </div>
  );
}


