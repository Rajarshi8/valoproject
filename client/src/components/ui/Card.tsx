import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    noPadding?: boolean;
    onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', noPadding = false, onClick }) => {
    return (
        <div
            className={`bg-valorant-dark2 border border-gray-800 relative overflow-hidden group ${className}`}
            onClick={onClick}
        >
            {/* Top accent line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent opacity-50"></div>

            {/* Content */}
            <div className={`relative z-10 ${noPadding ? '' : 'p-6'}`}>
                {children}
            </div>

            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gray-600"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gray-600"></div>
        </div>
    );
};
