import React, { useRef } from 'react';

interface ScanButtonProps {
  onImageSelected: (file: File) => void;
  disabled?: boolean;
}

const ScanButton: React.FC<ScanButtonProps> = ({ onImageSelected, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImageSelected(e.target.files[0]);
    }
  };

  return (
    <div className="w-full flex justify-center">
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`
          relative group w-24 h-24 rounded-full flex items-center justify-center 
          shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)] transition-all duration-300
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
        `}
      >
        {/* Animated Background Ring */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-full animate-pulse opacity-75 group-hover:opacity-100"></div>
        
        {/* Inner Button */}
        <div className="absolute inset-1 bg-slate-900 rounded-full flex items-center justify-center z-10">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        </div>
      </button>
    </div>
  );
};

export default ScanButton;