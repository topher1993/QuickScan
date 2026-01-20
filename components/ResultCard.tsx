import React, { useState } from 'react';
import { ExtractedData } from '../types';

interface ResultCardProps {
  data: ExtractedData;
  onReset: () => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ data, onReset }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const performCopy = async (text: string): Promise<boolean> => {
    try {
      // Primary method: Modern Clipboard API (Requires HTTPS)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers or HTTP contexts
        const textArea = document.createElement("textarea");
        textArea.value = text;
        
        // Ensure it's not visible but part of DOM
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      }
    } catch (err) {
      console.error('Copy failed', err);
      return false;
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    const success = await performCopy(text);
    if (success) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } else {
      alert("Could not copy automatically. Please copy manually.");
    }
  };

  const handleOpenGCash = async () => {
    // 1. Copy the phone number to clipboard automatically
    const success = await performCopy(data.phoneNumber);
    
    if (success) {
      setCopiedField('gcash');
      // 2. Attempt to open GCash using its URL scheme
      setTimeout(() => {
        window.location.href = "gcash://";
      }, 500);
      
      setTimeout(() => setCopiedField(null), 3000);
    } else {
      alert("Please ensure you are using HTTPS to allow clipboard access.");
    }
  };

  // Create a combined string for single-click full copy
  const fullSummary = `Name: ${data.name}\nPhone: ${data.phoneNumber}\nAmount: ${data.amount}`;

  return (
    <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 border border-slate-700 shadow-xl animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Extracted Details</h2>
        <span className="text-xs font-medium px-2 py-1 bg-green-500/20 text-green-400 rounded-full">Success</span>
      </div>

      <div className="space-y-4">
        {/* GCash Primary Action */}
        <button
          onClick={handleOpenGCash}
          className="w-full group relative overflow-hidden bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 mb-6"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          <span className="relative z-10 flex items-center gap-2">
            {copiedField === 'gcash' ? 'Number Copied! Opening...' : 'Copy Number & Open GCash'}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </span>
        </button>

        {/* Amount */}
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
          <label className="text-xs text-slate-400 uppercase tracking-wider">Amount</label>
          <div className="flex justify-between items-end">
            <span className="text-3xl font-bold text-white tracking-tight">{data.amount}</span>
            <button 
              onClick={() => copyToClipboard(data.amount.toString(), 'amount')}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium px-3 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
            >
              {copiedField === 'amount' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Name */}
        <div className="flex items-center justify-between p-3 border-b border-slate-700/50">
          <div>
            <label className="text-xs text-slate-400 block">Name</label>
            <span className="text-lg text-slate-200">{data.name}</span>
          </div>
          <button 
            onClick={() => copyToClipboard(data.name, 'name')}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
             {copiedField === 'name' ? (
               <span className="text-xs text-green-400 font-bold">✓</span>
             ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
             )}
          </button>
        </div>

        {/* Phone */}
        <div className="flex items-center justify-between p-3 border-b border-slate-700/50">
          <div>
            <label className="text-xs text-slate-400 block">Phone</label>
            <span className="text-lg text-slate-200 font-mono">{data.phoneNumber}</span>
          </div>
          <button 
            onClick={() => copyToClipboard(data.phoneNumber, 'phone')}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
             {copiedField === 'phone' ? (
               <span className="text-xs text-green-400 font-bold">✓</span>
             ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
             )}
          </button>
        </div>
      </div>

      <div className="mt-8 flex gap-3">
         <button
            onClick={() => copyToClipboard(fullSummary, 'all')}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-4 rounded-xl transition-colors text-sm"
          >
            {copiedField === 'all' ? 'All Copied!' : 'Copy All'}
          </button>
          
          <button
            onClick={onReset}
            className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold py-3 px-4 rounded-xl transition-all"
          >
            Scan New
          </button>
      </div>
    </div>
  );
};

export default ResultCard;