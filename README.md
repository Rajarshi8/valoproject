# Valorant Ping Checker

A production-ready, web-based tool designed to measure your network latency (ping) to various Valorant server regions. This application features a premium, Valorant-inspired user interface and uses a local backend proxy to perform accurate TCP pings to real server endpoints (AWS).

![Valorant Ping Checker Screenshot](./client/public/screenshot_placeholder.png)
*(Note: You can add a screenshot here later)*

## Features

*   **Accurate Latency Measurement**: Uses a local Node.js proxy to perform TCP handshakes with AWS EC2 regional endpoints that are geographically co-located with Valorant server locations for realistic ping values.
*   **Valorant Aesthetics**: A sleek, dark-themed UI with Valorant's signature red accents, custom fonts, and micro-animations.
*   **Region Recommendations**: Automatically identifies and recommends the best server region for you based on lowest latency and packet loss.
*   **Detailed Metrics**: Displays Round-Trip Time (RTT), Jitter, and Packet Loss for each region.
*   **Shareable Results**: Copy your results to the clipboard or download a JSON report.

## Tech Stack

### Frontend (`/client`)
*   **Framework**: React 19 (via Vite)
*   **Styling**: Tailwind CSS (v3.4) with custom Valorant theme configuration
*   **Language**: TypeScript
*   **Linting**: ESLint

### Backend (`/server`)
*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Features**:
    *   Acts as a proxy to bypass browser CORS/security restrictions for pinging external IPs.
    *   Performs TCP connections to measure handshake time (RTT).
    *   WebSocket support (optional/fallback).

## Getting Started

### Prerequisites
*   Node.js (v18 or higher recommended)
*   npm (Node Package Manager)

### Installation

1.  **Clone the repository** (if applicable) or navigate to the project root.

2.  **Install Backend Dependencies**:
    ```bash
    cd server
    npm install
    ```

3.  **Install Frontend Dependencies**:
    ```bash
    cd ../client
    npm install
    ```

### Running the Project

You need to run both the backend server and the frontend client simultaneously.

1.  **Start the Backend Server**:
    Open a terminal and run:
    ```bash
    cd server
    node index.js
    ```
    The server will start on `http://localhost:3001`.

2.  **Start the Frontend Client**:
    Open a *new* terminal window/tab and run:
    ```bash
    cd client
    npm run dev
    ```
    The client will start on `http://localhost:5173`.

3.  **Open in Browser**:
    Visit [http://localhost:5173](http://localhost:5173) to use the application.

## How It Works

Browsers cannot directly "ping" arbitrary IP addresses due to security sandboxing. To solve this:
1.  The **Frontend** sends a request to the **Local Backend** (`/ping?host=...`).
2.  The **Backend** attempts to establish a TCP connection to the specified target host (e.g., `dynamodb.us-east-1.amazonaws.com` for NA).
3.  The time taken to establish the connection (TCP Handshake) is measured and returned as the "Ping".
4.  This provides a much more accurate representation of network latency than simple HTTP requests or WebSocket estimates.

## License

ISC
