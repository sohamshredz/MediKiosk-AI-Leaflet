import React from 'react';

interface PulseWaveProps {
  className?: string;
  color?: 'marigold' | 'teal' | 'coral' | 'white';
  height?: number;
  animated?: boolean;
}

export const PulseWave: React.FC<PulseWaveProps> = ({
  className = 'w-full h-7',
  color = 'marigold',
  height = 28,
  animated = true
}) => {
  const strokeColor = {
    marigold: '#E2A33B',
    teal: '#0E3B39',
    coral: '#C1502E',
    white: '#FFFFFF'
  }[color];

  return (
    <div className={`overflow-hidden flex items-center ${className}`}>
      <svg 
        viewBox="0 0 500 28" 
        className="w-full h-full" 
        preserveAspectRatio="none"
      >
        <path
          className={animated ? 'pulse-path' : ''}
          d="M0 14 H100 L112 4 L124 24 L136 14 H190 L202 4 L214 24 L226 14 H290 L302 4 L314 24 L326 14 H390 L402 4 L414 24 L426 14 H500"
          stroke={strokeColor}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
};
