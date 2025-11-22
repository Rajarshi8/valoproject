import { Card } from './ui/Card';
import { Sparkline } from './Sparkline';
import type { PingResult, Region } from '../lib/ping';

interface RegionCardProps {
    region: Region;
    result?: PingResult;
    loading?: boolean;
    error?: string;
    onTest?: () => void;
    progress?: { current: number; total: number };
}

export const RegionCard: React.FC<RegionCardProps> = ({ 
    region, 
    result, 
    loading, 
    error, 
    onTest,
    progress 
}) => {
    const getStatusColor = (rtt: number) => {
        if (rtt < 80) return 'text-green-400';
        if (rtt < 150) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getStatusText = (rtt: number) => {
        if (rtt < 80) return 'EXCELLENT';
        if (rtt < 150) return 'MODERATE';
        return 'POOR';
    };

    const getStatusBgColor = (rtt: number) => {
        if (rtt < 80) return 'bg-green-400';
        if (rtt < 150) return 'bg-yellow-400';
        return 'bg-red-400';
    };

    return (
        <Card
            className={`h-full flex flex-col justify-between transition-all hover:border-gray-600 cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${loading ? 'opacity-80' : ''}`}
            onClick={() => !loading && onTest?.()}
            role="button"
            tabIndex={0}
            aria-label={`Test ping to ${region.name}`}
            aria-busy={loading}
            onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !loading) {
                    e.preventDefault();
                    onTest?.();
                }
            }}
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-bold uppercase tracking-widest text-gray-400">
                        {region.name}
                    </h3>
                    <div className="text-xs text-gray-600 font-mono uppercase">{region.id}</div>
                </div>
                {result && !loading && (
                    <div 
                        className={`text-xs font-bold px-2 py-1 bg-opacity-10 rounded ${getStatusBgColor(result.rtt).replace('bg-', 'bg-')} ${getStatusColor(result.rtt)}`}
                        role="status"
                        aria-label={`Connection status: ${getStatusText(result.rtt)}`}
                    >
                        {getStatusText(result.rtt)}
                    </div>
                )}
            </div>

            <div className="flex-grow flex flex-col justify-center min-h-[120px]">
                {loading ? (
                    <div className="space-y-3" role="status" aria-live="polite">
                        <div className="flex items-center justify-center space-x-2">
                            <div className="w-2 h-2 bg-valorant-red rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-valorant-red rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-valorant-red rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        {progress && (
                            <div className="text-center">
                                <div className="text-xs text-gray-500 mb-2">
                                    Testing {progress.current}/{progress.total}
                                </div>
                                <div className="w-full bg-gray-800 rounded-full h-1">
                                    <div 
                                        className="bg-valorant-red h-1 rounded-full transition-all duration-300"
                                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                        role="progressbar"
                                        aria-valuenow={progress.current}
                                        aria-valuemin={0}
                                        aria-valuemax={progress.total}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : error ? (
                    <div className="text-red-500 text-sm text-center" role="alert">
                        Connection Failed
                    </div>
                ) : result ? (
                    <div className="space-y-3">
                        <div className="flex items-baseline justify-between">
                            <div>
                                <span className="text-4xl font-bold text-white">
                                    {result.rtt}
                                </span>
                                <span className="text-sm text-gray-500 ml-1">ms</span>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-gray-500" title="Jitter (latency variation)">
                                    Jitter: {result.jitter}ms
                                </div>
                            </div>
                        </div>
                        <div className="w-full h-8">
                            <Sparkline data={result.samples} width={200} height={32} />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 pt-2 border-t border-gray-800">
                            <span title="Packet loss percentage">
                                Loss: {result.packetLoss.toFixed(0)}%
                            </span>
                            <span title="Minimum and maximum latency">
                                {result.min}ms / {result.max}ms
                            </span>
                        </div>
                        <div className="text-xs text-gray-600 text-center">
                            {result.probeCount} probes • {new Date(result.timestamp).toLocaleTimeString()}
                        </div>
                    </div>
                ) : (
                    <div className="text-gray-600 text-sm text-center italic">
                        Click to test
                    </div>
                )}
            </div>
        </Card>
    );
};
