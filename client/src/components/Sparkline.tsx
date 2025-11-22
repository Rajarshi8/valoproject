import React from 'react';

interface SparklineProps {
    data: number[];
    width?: number;
    height?: number;
    color?: string;
    max?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({
    data,
    width = 100,
    height = 30,
    color = '#ff4655',
    max
}) => {
    if (data.length < 2) return null;

    const maxValue = max || Math.max(...data, 1);
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - (val / maxValue) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} className="overflow-visible">
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};
