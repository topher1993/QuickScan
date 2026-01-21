import React, { useState } from 'react';
import { ExtractedData } from '../types';

interface ResultCardProps {
  data: ExtractedData;
  onReset: () => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ data, onReset }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // iOS-Safe Synchronous Copy Method
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

  const copyToClipboard = async (text: string, field: string) => {
    let success = false;
    try {
        await navigator.clipboard.writeText(text);
        success = true;
    } catch {
        success = performSyncCopy(text);
    }

    if (success) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  // This function only handles the COPY part. 
  // The Navigation is handled natively by the <a> tag href.
  const handleCopyAndAllowNav = () => {
    const text = data.phoneNumber;
    
    // Attempt sync copy
    const success = performSyncCopy(text);
    
    if (success) {
      setCopiedField('gcash');
    } else {
      // Fallback async copy (might not finish before nav, but worth a try)
      copyToClipboard(text, 'gcash');
    }
    
    // Reset status
    setTimeout(() => setCopiedField(null), 3000);
  };

  return (
    <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 border border-slate-700 shadow-xl animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Ready to Pay</h2>
        <span className="text-xs font-bold px-2 py-1 bg-green-500/20 text-green-400 rounded border border-green-500/30">
          SCAN SUCCESS
        </span>
      </div>

      <div className="space-y-6">
        
        {/* STEP 1: Phone Number & Open GCash */}
        <div className="space-y-2">
            <label className="text-xs text-blue-300 font-bold tracking-wider uppercase ml-1">Step 1: Send Money</label>
            
            {/* 
                Use a native <a> tag. 
                This allows iOS to see a real link click, which is less likely to be blocked 
                than a JavaScript window.location redirect.
            */}
            <a
              href="gcash://"
              onClick={handleCopyAndAllowNav}
              className="w-full group relative overflow-hidden text-white font-bold py-5 px-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all active:scale-95 flex items-center justify-between bg-blue-600 hover:bg-blue-500"
            >
                <div className="flex flex-col items-start">
                    <span className="text-xs font-normal opacity-80 mb-0.5">
                        Copy Phone & Open App
                    </span>
                    <span className="text-xl tracking-wide font-mono">{data.phoneNumber}</span>
                </div>
                
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${copiedField === 'gcash' ? 'bg-white text-blue-600' : 'bg-blue-700/50'}`}>
                    <span className="text-sm font-bold">{copiedField === 'gcash' ? 'COPIED!' : 'OPEN'}</span>
                    {copiedField !== 'gcash' && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    )}
                </div>
            </a>
            
            {/* Dedicated "Just Open" button as backup */}
            <div className="flex gap-2 mt-2">
                <a href="gcash://" className="flex-1 text-center py-3 bg-slate-700/50 text-xs font-bold text-white border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors">
                   FORCE OPEN GCASH APP
                </a>
            </div>
            
            <p className="text-[10px] text-slate-500 text-center mt-2">
                Tip: If this doesn't work, open this page in <strong>Safari</strong> (not Messenger).
            </p>
        </div>

        {/* STEP 2: Amount */}
        <div className="space-y-2">
            <label className="text-xs text-slate-400 font-bold tracking-wider uppercase ml-1">Step 2: Enter Amount</label>
            <button 
                onClick={() => copyToClipboard(data.amount.toString(), 'amount')}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    copiedField === 'amount' 
                    ? 'bg-green-500/10 border-green-500/50' 
                    : 'bg-slate-900/50 border-slate-700 hover:border-slate-500'
                }`}
            >
                <div className="flex flex-col items-start">
                    <span className="text-3xl font-bold text-white tracking-tight">{data.amount}</span>
                </div>
                <div className="px-4 py-2 bg-slate-800 rounded-lg text-sm font-medium text-blue-400">
                    {copiedField === 'amount' ? 'COPIED ✓' : 'COPY AMOUNT'}
                </div>
            </button>
        </div>

        {/* DETAILS: Name (Validation) */}
        <div className="pt-4 border-t border-slate-700/50">
            <div className="flex items-center justify-between px-2">
                <div>
                    <label className="text-xs text-slate-500 block mb-1">Verify Name</label>
                    <span className="text-base text-slate-300 font-medium">{data.name}</span>
                </div>
                <button 
                    onClick={() => copyToClipboard(data.name, 'name')}
                    className="p-2 text-slate-500 hover:text-white transition-colors"
                >
                    {copiedField === 'name' ? (
                    <span className="text-xs text-green-400 font-bold">Copied</span>
                    ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    )}
                </button>
            </div>
        </div>
      </div>

      <div className="mt-8">
          <button
            onClick={onReset}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3 px-4 rounded-xl transition-all border border-slate-700"
          >
            Scan Another Receipt
          </button>
      </div>
    </div>
  );
};

export default ResultCard;