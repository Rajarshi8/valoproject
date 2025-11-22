import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    ...props
}) => {
    const baseStyles = "font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center relative overflow-hidden group";

    const variants = {
        primary: "bg-valorant-red text-white hover:bg-red-600 clip-path-button",
        secondary: "bg-valorant-dark2 text-white border border-gray-700 hover:border-valorant-red",
        outline: "bg-transparent border-2 border-valorant-text text-valorant-text hover:bg-valorant-text hover:text-valorant-dark"
    };

    const sizes = {
        sm: "px-4 py-2 text-xs",
        md: "px-6 py-3 text-sm",
        lg: "px-8 py-4 text-base"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            <span className="relative z-10">{children}</span>
            {/* Decorative corner for primary */}
            {variant === 'primary' && (
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-white transform rotate-45 translate-y-1 translate-x-1"></span>
            )}
        </button>
    );
};
