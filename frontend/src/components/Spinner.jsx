import React from 'react';

const Spinner = ({ size = 'md', color = 'blue' }) => {
  // Map size prop to Tailwind classes
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  // Map color prop to Tailwind classes
  const colorClasses = {
    blue: 'border-blue-500',
    gray: 'border-gray-500',
    white: 'border-white'
  };

  const spinnerSize = sizeClasses[size] || sizeClasses.md;
  const spinnerColor = colorClasses[color] || colorClasses.blue;

  return (
    <div className={`${spinnerSize} border-2 ${spinnerColor} border-t-transparent rounded-full animate-spin`}></div>
  );
};

export default Spinner; 