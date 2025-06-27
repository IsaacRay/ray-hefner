import Link from 'next/link';
import {Strawberries, Sausages, Milk, StringCheese, Pepperoni, Yogurts, BabyBell, GranolaBars, OtherGroceries} from "../buttons";

export default function Groceries() {
  const groceryItems = [
    { component: Strawberries, name: "Strawberries", emoji: "🍓" },
    { component: Sausages, name: "Sausages", emoji: "🌭" },
    { component: StringCheese, name: "String Cheese", emoji: "🧀" },
    { component: Pepperoni, name: "Pepperoni", emoji: "🍕" },
    { component: Yogurts, name: "Yogurts", emoji: "🥛" },
    { component: BabyBell, name: "Baby Bell", emoji: "🧀" },
    { component: GranolaBars, name: "Granola Bars", emoji: "🥜" },
    { component: Milk, name: "Milk", emoji: "🥛" }
  ];

  return (
    <div className="container">
      <main className="mt-8">
        <div className="card">
          <div className="card-header">
            <h1 className="card-title">Grocery Shopping</h1>
            <p className="card-subtitle">Quick add items to your shopping list</p>
          </div>
          
          <div className="mb-6">
            <Link href="/home" className="btn btn-outline btn-sm">
              ← Back to Home
            </Link>
          </div>

          <div className="d-grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {/* Quick Add Items */}
            <div className="card">
              <h2 className="card-title text-lg mb-4">Common Items</h2>
              <div className="d-grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                {groceryItems.map(({ component: Component, name, emoji }) => (
                  <div key={name} className="text-center">
                    <div className="text-2xl mb-2">{emoji}</div>
                    <Component />
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Items */}
            <div className="card">
              <h2 className="card-title text-lg mb-4">Other Items</h2>
              <div className="text-center">
                <div className="text-2xl mb-4">🛒</div>
                <OtherGroceries />
                <p className="text-secondary text-sm mt-3">
                  Use this to add custom items not in the quick list
                </p>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="card mt-6" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <div className="text-center">
              <h3 className="font-medium mb-2">How it works</h3>
              <p className="text-secondary text-sm">
                Click any item button to automatically add it to your shopping list via IFTTT integration.
                Items will be sent to your preferred shopping list app.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


