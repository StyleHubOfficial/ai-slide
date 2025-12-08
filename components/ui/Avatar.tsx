
import React, { useState, useEffect } from 'react';
import UserIcon from '../icons/UserIcon';

interface AvatarProps {
  role: 'user' | 'model';
  className?: string;
  onClick?: () => void;
}

const Avatar: React.FC<AvatarProps> = ({ role, className = '', onClick }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (isAnimating) {
        timeout = setTimeout(() => setIsAnimating(false), 1500);
    }
    return () => clearTimeout(timeout);
  }, [isAnimating]);

  const handleClick = () => {
    // Always trigger animation on click for model
    if (role === 'model') {
      setIsAnimating(true);
    }
    if (onClick) onClick();
  };

  return (
    <div 
      onClick={handleClick}
      className={`
        relative flex items-center justify-center rounded-full shrink-0 shadow-lg border border-white/10 overflow-hidden
        transition-all duration-300
        ${role === 'model' 
          ? 'w-10 h-10 bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-sky-500/20 cursor-pointer hover:shadow-[0_0_20px_rgba(56,189,248,0.6)]' 
          : 'w-10 h-10 bg-slate-700 text-slate-300'
        }
        ${isAnimating && role === 'model' ? 'scale-110' : ''}
        ${className}
      `}
    >
      {role === 'model' ? (
        <div className="w-full h-full p-1 relative">
           <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
             {/* Head Group */}
             <g className={`origin-center transition-transform duration-300 ${isAnimating ? 'animate-robot-bounce' : ''}`}>
                {/* Face Shape */}
                <rect x="3" y="3" width="18" height="18" rx="5" className="fill-white" />
                
                {/* Eyes Group */}
                <g className="origin-center">
                    <circle cx="8" cy="10" r="1.5" className={`fill-slate-900 origin-center ${isAnimating ? 'animate-robot-blink-fast' : 'animate-robot-blink'}`} />
                    <circle cx="16" cy="10" r="1.5" className={`fill-slate-900 origin-center ${isAnimating ? 'animate-robot-blink-fast' : 'animate-robot-blink'}`} />
                </g>

                {/* Mouth */}
                <path 
                  d="M9 15c1 1 5 1 6 0" 
                  stroke="#0f172a" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  className={`origin-center transition-all duration-300 ${isAnimating ? 'animate-robot-talk' : ''}`}
                />
             </g>
           </svg>
           
           {/* Glowing Effect for AI */}
           <div className={`absolute inset-0 rounded-full bg-sky-400 opacity-20 pointer-events-none ${isAnimating ? 'animate-ping' : 'animate-pulse'}`}></div>
        </div>
      ) : (
        <UserIcon className="w-5 h-5" />
      )}
    </div>
  );
};

export default Avatar;
