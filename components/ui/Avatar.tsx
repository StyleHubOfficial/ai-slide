
import React from 'react';
import RobotIcon from '../icons/RobotIcon';
import UserIcon from '../icons/UserIcon';

interface AvatarProps {
  role: 'user' | 'model';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ role, className = '' }) => {
  return (
    <div 
      className={`
        relative flex items-center justify-center rounded-full shrink-0 shadow-lg border border-white/10
        ${role === 'model' 
          ? 'w-10 h-10 bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-sky-500/20' 
          : 'w-10 h-10 bg-slate-700 text-slate-300'
        }
        ${className}
      `}
    >
      {role === 'model' ? (
        <>
          <RobotIcon className="w-6 h-6 z-10" />
          {/* Glowing Effect for AI */}
          <div className="absolute inset-0 rounded-full bg-sky-400 opacity-20 animate-pulse"></div>
        </>
      ) : (
        <UserIcon className="w-5 h-5" />
      )}
    </div>
  );
};

export default Avatar;
