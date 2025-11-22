import { Card } from './ui/Card';
import { Sparkline } from './Sparkline';
import type { PingResult, Region } from '../lib/ping';

interface RegionCardProps {
    region: Region;
    result?: PingResult;
    loading?: boolean;
    error?: string;
    onTest?: () => void;
}

export const RegionCard: React.FC<RegionCardProps> = ({ region, result, loading, error, onTest }) => {
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

    return (
        <Card
            className={`h-full flex flex-col justify-between transition-all hover:border-gray-600 cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${loading ? 'opacity-80' : ''}`}
            onClick={() => !loading && onTest?.()}
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-bold uppercase tracking-widest text-gray-400">{region.name}</h3>
                    <div className="text-xs text-gray-600 font-mono">{region.id}</div>
                </div>
                {result && !loading && (
                    <div className={`text-xs font-bold px-2 py-1 bg-opacity-10 rounded ${getStatusColor(result.rtt).replace('text-', 'bg-')} ${getStatusColor(result.rtt)}`}>
                        {getStatusText(result.rtt)}
                    </div>
                )}
            </div>

            <div className="flex-grow flex flex-col justify-center min-h-[80px]">
                {loading ? (
                    <div className="flex items-center justify-center space-x-2 animate-pulse">
                        <div className="w-2 h-2 bg-valorant-red rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-valorant-red rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-valorant-red rounded-full animate-bounce delay-150"></div>
                    </div>
                ) : error ? (
                    <div className="text-red-500 text-sm text-center">Connection Failed</div>
                ) : result ? (
                    <div className="space-y-2">
                        <div className="flex items-baseline justify-between">
                            <span className="text-4xl font-bold text-white">{result.rtt}<span className="text-sm text-gray-500 ml-1">ms</span></span>
                            <span className="text-xs text-gray-500">Jitter: {result.jitter}ms</span>
                        </div>
                        <div className="w-full h-8">
                            <Sparkline data={result.samples} width={200} height={32} />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-2 pt-2 border-t border-gray-800">
                            <span>Loss: {result.packetLoss.toFixed(0)}%</span>
                            <span>Min: {result.min} / Max: {result.max}</span>
                        </div>
                    </div>
                ) : (
                    <div className="text-gray-600 text-sm text-center italic">Ready to test</div>
                )}
            </div>
        </Card>
    );
};
