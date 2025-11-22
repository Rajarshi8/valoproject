import { useState } from 'react';
import { measureLatency } from './lib/ping';
import type { Region, PingResult } from './lib/ping';
import { RegionCard } from './components/RegionCard';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';

// Configuration for regions using AWS EC2 endpoints co-located with Valorant servers
// These endpoints are in the same AWS regions as Valorant's actual game servers
const REGIONS: Region[] = [
  { id: 'na', name: 'North America', url: '/api', host: 'ec2.us-east-1.amazonaws.com', port: '443' },
  { id: 'eu', name: 'Europe', url: '/api', host: 'ec2.eu-central-1.amazonaws.com', port: '443' },
  { id: 'kr', name: 'Korea', url: '/api', host: 'ec2.ap-northeast-2.amazonaws.com', port: '443' },
  { id: 'br', name: 'Brazil', url: '/api', host: 'ec2.sa-east-1.amazonaws.com', port: '443' },
  { id: 'latam', name: 'Latin America', url: '/api', host: 'ec2.us-east-1.amazonaws.com', port: '443' },
  { id: 'ap', name: 'Asia Pacific', url: '/api', host: 'ec2.ap-southeast-1.amazonaws.com', port: '443' },
];

interface TestProgress {
  current: number;
  total: number;
}

function App() {
  const [results, setResults] = useState<Record<string, PingResult>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState<Record<string, TestProgress>>({});
  const [testing, setTesting] = useState(false);
  const [showTips, setShowTips] = useState(false);

  const runTests = async () => {
    setTesting(true);
    setResults({});
    setProgress({});

    // Run tests sequentially for better accuracy (avoids bandwidth congestion)
    for (const region of REGIONS) {
      setLoading(prev => ({ ...prev, [region.id]: true }));
      try {
        const result = await measureLatency(region, 10, (current, total, latestRtt) => {
          setProgress(prev => ({ 
            ...prev, 
            [region.id]: { current, total } 
          }));
        });
        setResults(prev => ({ ...prev, [region.id]: result }));
      } catch (e) {
        console.error(`Test failed for ${region.name}:`, e);
      }
      setLoading(prev => ({ ...prev, [region.id]: false }));
      setProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[region.id];
        return newProgress;
      });
    }
    setTesting(false);
  };

  const runSingleTest = async (regionId: string) => {
    if (testing || loading[regionId]) return;

    const region = REGIONS.find(r => r.id === regionId);
    if (!region) return;

    setLoading(prev => ({ ...prev, [regionId]: true }));
    try {
      const result = await measureLatency(region, 10, (current, total) => {
        setProgress(prev => ({ 
          ...prev, 
          [regionId]: { current, total } 
        }));
      });
      setResults(prev => ({ ...prev, [regionId]: result }));
    } catch (e) {
      console.error(`Test failed for ${region.name}:`, e);
    }
    setLoading(prev => ({ ...prev, [regionId]: false }));
    setProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[regionId];
      return newProgress;
    });
  };

  const getBestRegion = () => {
    const validResults = Object.entries(results).filter(([_, r]) => r.packetLoss < 100);
    if (validResults.length === 0) return null;
    return validResults.reduce((prev, curr) => prev[1].rtt < curr[1].rtt ? prev : curr);
  };

  const bestRegion = getBestRegion();

  const downloadReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      regions: Object.entries(results).map(([id, result]) => ({
        id,
        name: REGIONS.find(r => r.id === id)?.name,
        ...result
      })),
      bestRegion: bestRegion ? {
        id: bestRegion[0],
        name: REGIONS.find(r => r.id === bestRegion[0])?.name,
        rtt: bestRegion[1].rtt
      } : null
    };
    
    const data = JSON.stringify(report, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `valorant-ping-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateShareText = () => {
    if (!bestRegion) return '';
    
    const regionName = REGIONS.find(r => r.id === bestRegion[0])?.name;
    const sortedResults = Object.entries(results)
      .filter(([_, r]) => r.packetLoss < 100)
      .sort((a, b) => a[1].rtt - b[1].rtt);
    
    const summary = sortedResults
      .slice(0, 3)
      .map(([id, result]) => `${REGIONS.find(r => r.id === id)?.name}: ${result.rtt}ms`)
      .join(', ');
    
    return `My Valorant Ping Check\n✅ Best: ${regionName} (${bestRegion[1].rtt}ms)\n📊 ${summary}`;
  };

  const copyShareText = async () => {
    const text = generateShareText();
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (e) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Copied to clipboard!');
    }
  };

  const getPlayabilityStatus = (rtt: number) => {
    if (rtt < 80) return { text: 'Recommended', color: 'text-green-400', icon: '✓' };
    if (rtt < 150) return { text: 'Playable', color: 'text-yellow-400', icon: '⚠' };
    return { text: 'Not Recommended', color: 'text-red-400', icon: '✗' };
  };

  return (
    <div className="min-h-screen bg-valorant-dark text-valorant-text p-4 md:p-8 font-sans selection:bg-valorant-red selection:text-white">
      <header className="max-w-6xl mx-auto mb-12 flex justify-between items-center border-b border-gray-800 pb-6">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-valorant-red transform rotate-45" aria-hidden="true"></div>
          <h1 className="text-2xl font-bold tracking-tighter uppercase font-valorant">
            VALORANT PING
          </h1>
        </div>
        <nav className="text-sm text-gray-500 uppercase tracking-widest space-x-6">
          <button 
            onClick={() => setShowTips(!showTips)} 
            className="hover:text-valorant-red transition-colors focus:outline-none focus:text-valorant-red"
            aria-expanded={showTips}
          >
            Tips
          </button>
          <a 
            href="#privacy" 
            className="hover:text-valorant-red transition-colors focus:outline-none focus:text-valorant-red"
          >
            Privacy
          </a>
        </nav>
      </header>

      {showTips && (
        <div className="max-w-6xl mx-auto mb-8">
          <Card>
            <h3 className="text-xl font-bold uppercase mb-4 text-gray-400">Tips to Improve Your Ping</h3>
            <ul className="space-y-2 text-gray-400 text-sm list-disc list-inside">
              <li>Use a wired Ethernet connection instead of Wi-Fi</li>
              <li>Close bandwidth-heavy applications (streaming, downloads)</li>
              <li>Connect to a server closer to your physical location</li>
              <li>Restart your router to clear temporary issues</li>
              <li>Check for background Windows updates or cloud sync</li>
              <li>Consider upgrading your internet plan or switching ISPs</li>
            </ul>
          </Card>
        </div>
      )}

      <main className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-7xl font-bold uppercase tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600">
            Check Your Latency
          </h2>
          <p className="text-gray-500 mb-8 max-w-2xl mx-auto">
            Measure your network latency to Valorant server regions. 
            Get detailed metrics including RTT, jitter, and packet loss.
          </p>
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={runTests}
              disabled={testing}
              className={testing ? 'opacity-50 cursor-not-allowed' : ''}
              aria-busy={testing}
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
              progress={progress[region.id]}
              onTest={() => runSingleTest(region.id)}
            />
          ))}
        </div>

        {bestRegion && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
            <Card className="md:col-span-2">
              <h3 className="text-xl font-bold uppercase mb-4 text-gray-400">Recommendation</h3>
              <div className="flex items-center space-x-4 mb-4">
                <div className="text-4xl font-bold text-valorant-red">
                  {REGIONS.find(r => r.id === bestRegion[0])?.name}
                </div>
                <div className={`px-3 py-1 ${getPlayabilityStatus(bestRegion[1].rtt).color.replace('text-', 'bg-')} bg-opacity-20 ${getPlayabilityStatus(bestRegion[1].rtt).color} text-sm font-bold uppercase rounded`}>
                  {getPlayabilityStatus(bestRegion[1].rtt).icon} {getPlayabilityStatus(bestRegion[1].rtt).text}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Average Latency:</span>
                  <span className="font-bold">{bestRegion[1].rtt}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Jitter:</span>
                  <span className="font-bold">{bestRegion[1].jitter}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Packet Loss:</span>
                  <span className="font-bold">{bestRegion[1].packetLoss.toFixed(1)}%</span>
                </div>
              </div>
              <p className="mt-4 text-gray-400 text-sm max-w-lg">
                {bestRegion[1].rtt < 80 
                  ? 'Your connection to this region is optimal. You should experience minimal lag and responsive gameplay.'
                  : bestRegion[1].rtt < 150
                  ? 'Your connection is acceptable. You may experience occasional lag during intense moments.'
                  : 'Your connection may result in noticeable lag. Consider the tips above to improve your ping.'}
              </p>
            </Card>

            <Card>
              <h3 className="text-xl font-bold uppercase mb-4 text-gray-400">Actions</h3>
              <div className="space-y-3">
                <Button 
                  variant="secondary" 
                  className="w-full" 
                  onClick={downloadReport}
                  aria-label="Download detailed JSON report"
                >
                  Download JSON Report
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={copyShareText}
                  aria-label="Copy results to clipboard"
                >
                  Share Result
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>

      <footer className="max-w-6xl mx-auto mt-20 border-t border-gray-800 pt-8 space-y-4">
        <div id="privacy" className="text-gray-600 text-xs">
          <h4 className="uppercase tracking-widest mb-2 font-bold">Privacy Notice</h4>
          <p>This tool performs network tests directly from your browser. 
          No personal data is collected or stored. All tests are performed client-side and through a local proxy server.
          Your IP address may be temporarily logged by the server for rate limiting purposes only.</p>
        </div>
        <div className="text-center text-gray-600 text-xs uppercase tracking-widest">
          <p>Not affiliated with Riot Games. Valorant is a trademark of Riot Games, Inc.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
