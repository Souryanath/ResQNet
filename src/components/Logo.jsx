import React from 'react';

export default function Logo({ size = 40, showText = true, className = "" }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* Red Circle Background */}
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="48" fill="#E63946" />
          
          {/* White Medical Cross */}
          <path 
            d="M35 25h30v20h20v10h-20v25h-30v-25h-20v-10h20z" 
            fill="white" 
          />
          
          {/* Heartbeat Line (Red) */}
          <path 
            d="M15 50 h10 l5 -10 l5 20 l5 -25 l5 30 l5 -15 h10" 
            fill="none" 
            stroke="#E63946" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          
          {/* Ambulance at the bottom */}
          <g transform="translate(38, 65) scale(0.6)">
            {/* Vehicle Body */}
            <rect x="0" y="5" width="40" height="20" rx="3" fill="white" />
            <rect x="30" y="5" width="12" height="12" rx="2" fill="white" />
            {/* Wheels */}
            <circle cx="10" cy="25" r="4" fill="#333" />
            <circle cx="35" cy="25" r="4" fill="#333" />
            {/* Red Cross on Ambulance */}
            <path d="M17 10h6v10h-6z M15 12h10v6h-10z" fill="#E63946" transform="scale(0.8) translate(5, 5)" />
          </g>
        </svg>
      </div>
      
      {showText && (
        <div className="text-center mt-2">
          <h1 className="text-[#E63946] font-black text-2xl tracking-tighter leading-none">ResQNet</h1>
          <p className="text-[#8a90a0] text-[0.6rem] font-bold uppercase tracking-[0.2em] mt-1">AI-Powered Emergency Response</p>
        </div>
      )}
    </div>
  );
}
