
import React, { useState } from 'react';
import RobotIcon from '../icons/RobotIcon';
import UserIcon from '../icons/UserIcon';

interface AvatarProps {
  role: 'user' | 'model';
  className?: string;
  onClick?: () => void;
}

const Avatar: React.FC<AvatarProps> = ({ role, className = '', onClick }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    if (role === 'model') {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600); // Match animation duration
    }
    if (onClick) onClick();
  };

  return (
    <div 
      onClick={handleClick}
      className={`
        relative flex items-center justify-center rounded-full shrink-0 shadow-lg border border-white/10
        transition-all duration-300
        ${role === 'model' 
          ? 'w-10 h-10 bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-sky-500/20 cursor-pointer hover:shadow-[0_0_20px_rgba(56,189,248,0.6)]' 
          : 'w-10 h-10 bg-slate-700 text-slate-300'
        }
        ${isAnimating ? 'animate-jelly' : ''}
        ${className}
      `}
    >
      {role === 'model' ? (
        <>
          <RobotIcon className="w-6 h-6 z-10" />
          {/* Glowing Effect for AI */}
          <div className={`absolute inset-0 rounded-full bg-sky-400 opacity-20 ${isAnimating ? 'animate-ping' : 'animate-pulse'}`}></div>
          {/* Extra burst ring on click */}
          {isAnimating && (
             <div className="absolute inset-0 rounded-full border-2 border-sky-300 opacity-0 animate-[ping_0.5s_cubic-bezier(0,0,0.2,1)]"></div>
          )}
        </>
      ) : (
        <UserIcon className="w-5 h-5" />
      )}
    </div>
  );
};

export default Avatar;