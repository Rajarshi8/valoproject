/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                valorant: {
                    red: '#ff4655',
                    dark: '#0b0b0d',
                    dark2: '#111113',
                    text: '#ece8e1',
                    cyan: '#0f1923', // Actually dark blue/cyan
                    white: '#ece8e1'
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'], // We'll use Inter as a proxy for the clean look
                valorant: ['Tungsten', 'sans-serif'] // Placeholder if we had the font, but we'll stick to standard for now
            }
        },
    },
    plugins: [],
}
