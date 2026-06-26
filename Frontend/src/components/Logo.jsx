import React from 'react';
import logoImg from '../assets/logo-fitzone.jpeg';

export default function Logo({ className = "h-12 w-auto", showText = true }) {
  return (
    <div className="flex items-center gap-3">
      <img 
        src={logoImg} 
        alt="Fitzone Logo" 
        className={`${className} object-contain rounded-lg border border-neutral-800 shadow-md`}
      />
      {showText && (
        <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-white via-neutral-200 to-orange-500 bg-clip-text text-transparent uppercase">
          Fit<span className="text-orange-500">Zone</span>
        </span>
      )}
    </div>
  );
}
