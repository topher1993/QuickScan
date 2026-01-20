import React, { useState } from 'react';
import { ExtractedData } from '../types';

interface ResultCardProps {
  data: ExtractedData;
  onReset: () => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ data, onReset }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Helper to detect iOS devices
  const isIOS = () => {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
  };

  // iOS-Safe Synchronous Copy Method
  // Required for iOS because 'await' breaks the deep link trigger
  const performSyncCopy = (text: string): boolean => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      
      // Critical for iOS: Ensure element is part of DOM but hidden
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      // Critical for iOS: Prevent zooming and allow selection
      textArea.contentEditable = "true";
      textArea.readOnly = false;
      
      document.body.appendChild(textArea);
      
      // Critical for iOS: Explicit range selection
      const range = document.createRange();
      range.selectNodeContents(textArea);
      const selection = window.getSelection();
      if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
      }
      textArea.setSelectionRange(0, 999999); 
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      console.error('Sync copy failed', err);
      return false;
    }
  };

  const performAsyncCopy = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      return performSyncCopy(text);
    } catch (err) {
      return performSyncCopy(text);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    // Standard copy button logic
    const success = await performAsyncCopy(text);
    if (success) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } else {
      alert("Could not copy automatically.");
    }
  };

  const handleOpenGCash = async () => {
    const text = data.phoneNumber;

    if (isIOS()) {
      // --- iOS STRATEGY ---
      // 1. Use SYNCHRONOUS copy (execCommand).
      // 2. Redirect IMMEDIATELY.
      const success = performSyncCopy(text);
      
      if (success) {
        setCopiedField('gcash');
        // Immediate redirect is crucial for iOS Safari
        window.location.href = "gcash://";
        setTimeout(() => setCopiedField(null), 3000);
      } else {
        alert("Could not copy number. Opening GCash anyway.");
        window.location.href = "gcash://";
      }

    } else {
      // --- ANDROID STRATEGY ---
      // 1. Use ASYNC copy (navigator.clipboard).
      // 2. Redirect IMMEDIATELY after promise, NO TIMEOUT.
      // Timeout on Android can break the "User Activation" token for deep links.
      try {
        await navigator.clipboard.writeText(text);
        setCopiedField('gcash');
        
        // Immediate redirect allows the deep link to capture the user gesture
        window.location.href = "gcash://";
        
        setTimeout(() => setCopiedField(null), 2000);
      } catch (err) {
        // Fallback if Async fails on Android
        performSyncCopy(text);
        setCopiedField('gcash');
        window.location.href = "gcash://";
      }
    }
  };

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
            {copiedField === 'gcash' ? 'Copied! Opening...' : 'Copy Number & Open GCash'}
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
      
      {/* Fallback link in case Deep Link fails completely */}
      <div className="mt-4 text-center">
        <a href="gcash://" className="text-xs text-slate-500 hover:text-blue-400 underline">
          If GCash didn't open, click here
        </a>
      </div>
    </div>
  );
};

export default ResultCard;