
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({ children, className = '', ...props }) => {
  return (
    <select
      {...props}
      className={`block w-full rounded-md border-0 bg-white/5 py-2 px-3 text-slate-200 shadow-sm
        ring-1 ring-inset ring-slate-700 focus:ring-2 focus:ring-inset focus:ring-sky-500
        sm:text-sm sm:leading-6
        ${className}`}
    >
      {children}
    </select>
  );
};

export default Select;
