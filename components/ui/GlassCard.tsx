
import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '' }) => {
  return (
    <div className={`glass-panel rounded-2xl p-6 shadow-2xl ${className}`}>
      {children}
    </div>
  );
};

export default GlassCard;
