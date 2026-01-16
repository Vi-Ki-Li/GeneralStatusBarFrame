import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
  variant?: 'text' | 'circular' | 'rectangular';
}

const Skeleton: React.FC<SkeletonProps> = ({ 
  width, 
  height, 
  borderRadius,
  className = '',
  style,
  variant = 'text'
}) => {
  const defaultStyles: React.CSSProperties = {
    width: width || (variant === 'text' ? '100%' : variant === 'circular' ? '40px' : '100%'),
    height: height || (variant === 'text' ? '1em' : variant === 'circular' ? '40px' : '100px'),
    borderRadius: borderRadius || (variant === 'circular' ? '50%' : '4px'),
  };

  return (
    <div 
      className={`skeleton ${className}`}
      style={{
        ...defaultStyles,
        ...style
      }}
    />
  );
};

export default Skeleton;