import React from 'react';
import '../../styles/LandingPage2.css';

const Button = ({ children, onClick, className }: { children: React.ReactNode, onClick?: () => void, className?: string }) => {
  return (
    <button
      onClick={onClick}
      className={`ghost-button ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;