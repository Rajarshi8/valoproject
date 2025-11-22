export interface PingResult {
    regionId: string;
    rtt: number; // Average RTT
    min: number;
    max: number;
    jitter: number;
    packetLoss: number;
    samples: number[];
    timestamp: number;
}

export interface Region {
    id: string;
    name: string;
    url: string; // Base URL for the probe
    wsUrl?: string; // WebSocket URL
    host?: string; // Real endpoint to ping via proxy
}

export const measureLatency = async (region: Region, samples: number = 10): Promise<PingResult> => {
    const results: number[] = [];
    let failed = 0;

    // Prefer WebSocket if available AND no specific host to proxy to
    // (If we have a host, we want to use the HTTP proxy to ping that host)
    if (region.wsUrl && !region.host) {
        try {
            const ws = new WebSocket(region.wsUrl);

            await new Promise<void>((resolve, reject) => {
                ws.onopen = () => resolve();
                ws.onerror = (e) => reject(e);
                // Timeout connection
                setTimeout(() => reject(new Error('Connection timeout')), 3000);
            });

            for (let i = 0; i < samples; i++) {
                try {
                    const start = performance.now();
                    ws.send(JSON.stringify({ id: i, t0: start }));

                    await new Promise<void>((resolve, reject) => {
                        const handler = (_msg: MessageEvent) => {
                            const end = performance.now();
                            results.push(end - start);
                            ws.removeEventListener('message', handler);
                            resolve();
                        };
                        ws.addEventListener('message', handler);
                        // Timeout per ping
                        setTimeout(() => {
                            ws.removeEventListener('message', handler);
                            reject(new Error('Ping timeout'));
                        }, 1000);
                    });

                    // Small delay between pings
                    await new Promise(r => setTimeout(r, 100));
                } catch (e) {
                    failed++;
                }
            }
            ws.close();
        } catch (e) {
            console.error(`WS Ping failed for ${region.name}:`, e);
            failed = samples;
        }
    } else {
        // HTTP Ping (Direct or Proxy)
        const url = region.host
            ? `${region.url}/ping?host=${region.host}`
            : `${region.url}/ping`;

        for (let i = 0; i < samples; i++) {
            try {
                const start = performance.now();
                const res = await fetch(url, { cache: 'no-store' });
                if (!res.ok) throw new Error('Ping failed');

                // If using proxy, we can use the RTT calculated by the server for better accuracy
                // or just use the full round trip. 
                // Using full round trip includes client->server latency which is good for "User->Game" simulation
                // if the server is local.
                // If the server returns 'rtt', let's use that if we want "Server->Game" latency.
                // But user wants "Actual pings". 
                // If server is local, Client->Server is ~0ms. So Client->Server->Game->Server->Client is roughly User->Game.
                // Let's stick to measuring full fetch time for now as it's simplest and accurate for local server.
                // Actually, let's check if the response has 'rtt' and maybe use it?
                // The server returns { rtt, t_server }. 
                // If we want total latency: Client->Server (local) + Server->Game (real) + Game->Server + Server->Client.
                // The 'rtt' from server is Server->Game->Server.
                // Since Client->Server is negligible (local), Server->Game->Server (server rtt) is the main component.
                // However, the fetch overhead adds some processing time.
                // Let's parse the JSON and see if 'rtt' is there.

                const data = await res.json();
                const end = performance.now();

                if (data.rtt) {
                    results.push(data.rtt);
                } else {
                    results.push(end - start);
                }

            } catch (e) {
                failed++;
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
            timestamp: Date.now()
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
        timestamp: Date.now()
    };
};
