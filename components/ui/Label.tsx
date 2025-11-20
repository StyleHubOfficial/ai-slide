
import React from 'react';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

const Label: React.FC<LabelProps> = ({ children, className = '', ...props }) => {
  return (
    <label
      {...props}
      className={`block text-sm font-medium leading-6 text-slate-300 mb-2 ${className}`}
    >
      {children}
    </label>
  );
};

export default Label;
