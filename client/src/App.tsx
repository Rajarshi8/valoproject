import { useState } from 'react';
import { measureLatency } from './lib/ping';
import type { Region, PingResult } from './lib/ping';
import { RegionCard } from './components/RegionCard';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';

// Configuration for regions (pointing to local probe for demo)
// In production, these would be real URLs like https://us-east.ping-val.com
const REGIONS: Region[] = [
  { id: 'na', name: 'North America', url: 'http://localhost:3001', host: 'dynamodb.us-east-1.amazonaws.com' },
  { id: 'eu', name: 'Europe', url: 'http://localhost:3001', host: 'dynamodb.eu-central-1.amazonaws.com' },
  { id: 'kr', name: 'Korea', url: 'http://localhost:3001', host: 'dynamodb.ap-northeast-2.amazonaws.com' },
  { id: 'br', name: 'Brazil', url: 'http://localhost:3001', host: 'dynamodb.sa-east-1.amazonaws.com' },
  { id: 'latam', name: 'Latin America', url: 'http://localhost:3001', host: 'dynamodb.us-east-1.amazonaws.com' },
  { id: 'ap', name: 'Asia Pacific', url: 'http://localhost:3001', host: 'dynamodb.ap-southeast-1.amazonaws.com' },
];

function App() {
  const [results, setResults] = useState<Record<string, PingResult>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState(false);

  const runTests = async () => {
    setTesting(true);
    setResults({});

    // Run sequentially or parallel? Parallel is faster but might affect accuracy due to bandwidth.
    // Let's do parallel batches or just all at once for simplicity in this demo.
    // For better accuracy, sequential is often preferred to avoid congestion.

    for (const region of REGIONS) {
      setLoading(prev => ({ ...prev, [region.id]: true }));
      try {
        const result = await measureLatency(region);
        setResults(prev => ({ ...prev, [region.id]: result }));
      } catch (e) {
        console.error(e);
      }
      setLoading(prev => ({ ...prev, [region.id]: false }));
    }
    setTesting(false);
  };

  const runSingleTest = async (regionId: string) => {
    if (testing || loading[regionId]) return;

    const region = REGIONS.find(r => r.id === regionId);
    if (!region) return;

    setLoading(prev => ({ ...prev, [regionId]: true }));
    try {
      const result = await measureLatency(region);
      setResults(prev => ({ ...prev, [regionId]: result }));
    } catch (e) {
      console.error(e);
    }
    setLoading(prev => ({ ...prev, [regionId]: false }));
  };

  const getBestRegion = () => {
    const validResults = Object.values(results).filter(r => r.packetLoss < 100);
    if (validResults.length === 0) return null;
    return validResults.reduce((prev, curr) => prev.rtt < curr.rtt ? prev : curr);
  };

  const bestRegion = getBestRegion();

  const downloadReport = () => {
    const data = JSON.stringify(results, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `valorant-ping-report-${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-valorant-dark text-valorant-text p-4 md:p-8 font-sans selection:bg-valorant-red selection:text-white">
      <header className="max-w-6xl mx-auto mb-12 flex justify-between items-center border-b border-gray-800 pb-6">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-valorant-red transform rotate-45"></div>
          <h1 className="text-2xl font-bold tracking-tighter uppercase font-valorant">VALORANT PING</h1>
        </div>
        <nav className="text-sm text-gray-500 uppercase tracking-widest space-x-6">
          <a href="#" className="hover:text-valorant-red transition-colors">About</a>
          <a href="#" className="hover:text-valorant-red transition-colors">Settings</a>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-7xl font-bold uppercase tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600">
            Check Your Latency
          </h2>
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={runTests}
              disabled={testing}
              className={testing ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {testing ? 'TESTING NETWORK...' : 'CHECK MY PING'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {REGIONS.map(region => (
            <RegionCard
              key={region.id}
              region={region}
              result={results[region.id]}
              loading={loading[region.id]}
              onTest={() => runSingleTest(region.id)}
            />
          ))}
        </div>

        {bestRegion && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
            <Card className="md:col-span-2">
              <h3 className="text-xl font-bold uppercase mb-4 text-gray-400">Recommendation</h3>
              <div className="flex items-center space-x-4">
                <div className="text-4xl font-bold text-valorant-red">
                  {REGIONS.find(r => r.id === bestRegion.regionId)?.name}
                </div>
                <div className="px-3 py-1 bg-green-500 bg-opacity-20 text-green-400 text-sm font-bold uppercase rounded">
                  Recommended
                </div>
              </div>
              <p className="mt-4 text-gray-400 max-w-lg">
                Your connection to this region is optimal. You should experience minimal lag and responsive gameplay.
              </p>
            </Card>

            <Card>
              <h3 className="text-xl font-bold uppercase mb-4 text-gray-400">Actions</h3>
              <div className="space-y-3">
                <Button variant="secondary" className="w-full" onClick={downloadReport}>
                  Download JSON Report
                </Button>
                <Button variant="outline" className="w-full" onClick={() => {
                  navigator.clipboard.writeText(`My Valorant Ping: ${bestRegion.rtt}ms (${REGIONS.find(r => r.id === bestRegion.regionId)?.name})`);
                  alert('Copied to clipboard!');
                }}>
                  Share Result
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>

      <footer className="max-w-6xl mx-auto mt-20 border-t border-gray-800 pt-8 text-center text-gray-600 text-xs uppercase tracking-widest">
        <p>Not affiliated with Riot Games. Valorant is a trademark of Riot Games, Inc.</p>
      </footer>
    </div>
  );
}

export default App;
