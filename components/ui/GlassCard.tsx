import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', style }) => {
  return (
    <div 
      className={`glass-panel rounded-2xl shadow-2xl ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

export default GlassCard;