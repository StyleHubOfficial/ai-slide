
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, className = '', ...props }) => {
  return (
    <button
      {...props}
      className={`
        inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-bold text-white 
        transition-all duration-200 ease-out transform active:scale-95
        disabled:pointer-events-none disabled:opacity-50 disabled:grayscale
        ${className}
      `}
    >
      {children}
    </button>
  );
};

export default Button;
