
"use client";
import { useRouter } from 'next/navigation';
import {ColtonDemerit, ColtonStar, FamilyRoomLight, IsaacGarage, KathrynGarage, Logging} from "../buttons";
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  
  return (
    <div className="container">
      <main className="mt-8">
        <div className="card">
          <div className="card-header">
            <h1 className="card-title">Home Control Center</h1>
            <p className="card-subtitle">Manage your smart home and family activities</p>
          </div>
          
          <div className="d-grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {/* Smart Home Controls */}
            <div className="card">
              <h2 className="card-title text-lg mb-4">Smart Home</h2>
              <div className="d-grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <IsaacGarage />
                <KathrynGarage />
                <FamilyRoomLight />
                <div style={{ gridColumn: '1 / -1' }}>
                  <Logging />
                </div>
              </div>
            </div>

            {/* Family Management */}
            <div className="card">
              <h2 className="card-title text-lg mb-4">Family Management</h2>
              <div className="d-flex gap-3" style={{ flexDirection: 'column' }}>
                <Link href="/groceries" className="btn btn-primary">
                  🛒 Groceries
                </Link>
                <Link href="/behavior" className="btn btn-success">
                  ⭐ Behavior Tracking
                </Link>
                <Link href="/tasks" className="btn btn-secondary">
                  ✅ Tasks
                </Link>
                <Link href="/calendar" className="btn btn-outline">
                  📅 Calendar
                </Link>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h2 className="card-title text-lg mb-4">Quick Actions</h2>
              <div className="d-flex gap-3" style={{ flexDirection: 'column' }}>
                <Link href="/manage-behaviors" className="btn btn-outline">
                  ⚙️ Manage Behaviors
                </Link>
                <Link href="/madison" className="btn btn-warning">
                  🗳️ Madison Voting
                </Link>
                <Link href="/squares" className="btn btn-outline">
                  🏈 Squares Pool
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


