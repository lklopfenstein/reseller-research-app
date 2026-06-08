import { fetchArbitrageDeals } from '@/services/slickdeals';
import Dashboard from '@/components/Dashboard';

export const revalidate = 3600; // Revalidate every hour

export default async function Home() {
  const products = await fetchArbitrageDeals();

  return (
    <main className="container">
      <header className="header animate-fade-in">
        <h1>Reseller Research</h1>
        <p>Your daily top 20 money-making arbitrage opportunities.</p>
        <div className="dashboard-meta">
          <span className="badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Live Data Feed
          </span>
          <span className="badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20v-6M6 20V10M18 20V4"></path>
            </svg>
            Sorted by Highest Margin
          </span>
        </div>
      </header>

      {products.length === 0 ? (
        <div className="loader-container">
          <p>No profitable deals found at the moment. Check back later!</p>
        </div>
      ) : (
        <Dashboard initialProducts={products} />
      )}
    </main>
  );
}
