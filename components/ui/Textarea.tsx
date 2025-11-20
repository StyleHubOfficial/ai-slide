
import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea: React.FC<TextareaProps> = ({ className = '', ...props }) => {
  return (
    <textarea
      {...props}
      className={`block w-full rounded-md border-0 bg-white/5 py-2 px-3 text-slate-200 shadow-sm
        ring-1 ring-inset ring-slate-700 placeholder:text-slate-500 
        focus:ring-2 focus:ring-inset focus:ring-sky-500
        sm:text-sm sm:leading-6
        ${className}`}
    />
  );
};

export default Textarea;
