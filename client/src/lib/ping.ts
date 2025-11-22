export interface PingResult {
    regionId: string;
    rtt: number; // Average RTT
    min: number;
    max: number;
    jitter: number;
    packetLoss: number;
    samples: number[];
    timestamp: number;
    probeCount: number;
}

export interface Region {
    id: string;
    name: string;
    url: string; // Base URL for the probe
    wsUrl?: string; // WebSocket URL
    host?: string; // Real endpoint to ping via proxy
    port?: string; // Port to use for ping (default: 443)
}

export type ProgressCallback = (currentSample: number, totalSamples: number, latestRtt?: number) => void;

export const measureLatency = async (
    region: Region,
    samples: number = 10,
    onProgress?: ProgressCallback
): Promise<PingResult> => {
    const results: number[] = [];
    let failed = 0;

    // Prefer WebSocket if available AND no specific host to proxy to
    if (region.wsUrl && !region.host) {
        try {
            const ws = new WebSocket(region.wsUrl);

            await new Promise<void>((resolve, reject) => {
                ws.onopen = () => resolve();
                ws.onerror = (e) => reject(e);
                setTimeout(() => reject(new Error('Connection timeout')), 5000);
            });

            for (let i = 0; i < samples; i++) {
                try {
                    const start = performance.now();
                    ws.send(JSON.stringify({
                        type: 'ping',
                        id: i,
                        t0: start
                    }));

                    await new Promise<void>((resolve, reject) => {
                        const handler = (_msg: MessageEvent) => {
                            const end = performance.now();
                            const rtt = end - start;
                            results.push(rtt);
                            ws.removeEventListener('message', handler);

                            if (onProgress) {
                                onProgress(i + 1, samples, rtt);
                            }

                            resolve();
                        };
                        ws.addEventListener('message', handler);
                        setTimeout(() => {
                            ws.removeEventListener('message', handler);
                            reject(new Error('Ping timeout'));
                        }, 2000);
                    });

                    await new Promise(r => setTimeout(r, 100));
                } catch (e) {
                    failed++;
                    if (onProgress) {
                        onProgress(i + 1, samples);
                    }
                }
            }
            ws.close();
        } catch (e) {
            console.error(`WebSocket ping failed for ${region.name}:`, e);
            failed = samples;
        }
    } else {
        // HTTP Ping (Direct or Proxy)
        const url = region.host
            ? `${region.url}/ping?host=${encodeURIComponent(region.host)}${region.port ? `&port=${region.port}` : ''}`
            : `${region.url}/ping`;

        for (let i = 0; i < samples; i++) {
            try {
                const start = performance.now();
                const res = await fetch(url, {
                    cache: 'no-store',
                    signal: AbortSignal.timeout(5000)
                });

                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                const data = await res.json();
                const end = performance.now();

                // Use server-calculated RTT if available (more accurate for proxy pings)
                const rtt = data.rtt || (end - start);
                results.push(rtt);

                if (onProgress) {
                    onProgress(i + 1, samples, rtt);
                }

            } catch (e) {
                failed++;
                if (onProgress) {
                    onProgress(i + 1, samples);
                }
            }
            await new Promise(r => setTimeout(r, 100));
        }
    }

    if (results.length === 0) {
        return {
            regionId: region.id,
            rtt: 0,
            min: 0,
            max: 0,
            jitter: 0,
            packetLoss: 100,
            samples: [],
            timestamp: Date.now(),
            probeCount: samples
        };
    }

    const min = Math.min(...results);
    const max = Math.max(...results);
    const avg = results.reduce((a, b) => a + b, 0) / results.length;

    // Jitter: Standard Deviation
    const variance = results.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / results.length;
    const jitter = Math.sqrt(variance);

    return {
        regionId: region.id,
        rtt: Math.round(avg),
        min: Math.round(min),
        max: Math.round(max),
        jitter: Math.round(jitter),
        packetLoss: (failed / samples) * 100,
        samples: results,
        timestamp: Date.now(),
        probeCount: samples
    };
};
