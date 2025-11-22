const net = require('net');

/**
 * Vercel Serverless Function for TCP Ping
 * Measures network latency by establishing TCP connections
 */
module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { host, port } = req.query;

    // If no host provided, return server time
    if (!host) {
        return res.status(200).json({ server_time: Date.now() });
    }

    // Perform TCP ping
    const targetPort = port || 443;
    const start = Date.now();

    const socket = net.connect(targetPort, host, () => {
        const rtt = Date.now() - start;
        socket.end();
        res.status(200).json({
            rtt,
            t_server: Date.now(),
            host,
            port: targetPort
        });
    });

    socket.on('error', (err) => {
        res.status(500).json({
            error: 'Ping failed',
            details: err.message,
            host,
            port: targetPort
        });
    });

    socket.setTimeout(5000, () => {
        socket.destroy();
        res.status(408).json({
            error: 'Timeout',
            host,
            port: targetPort
        });
    });
};
