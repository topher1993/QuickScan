import React, { useState, useEffect } from 'react';
import ScanButton from './components/ScanButton';
import ResultCard from './components/ResultCard';
import { AppState, ExtractedData } from './types';
import { extractDetailsFromImage, fileToGenerativePart } from './services/geminiService';

const saveScanToDatabase = async (data: ExtractedData) => {
  try {
    const response = await fetch('http://localhost:3001/api/scans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: data.phoneNumber,
        amount: data.amount,
        name: data.name,
      }),
    });
    if (!response.ok) {
      console.error('Failed to save scan to database');
    }
  } catch (error) {
    console.error('Error saving to database:', error);
  }
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [data, setData] = useState<ExtractedData | null>(null);
  const [errorState, setErrorState] = useState<{ message: string; isAuthError: boolean } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSecure, setIsSecure] = useState<boolean>(true);

  useEffect(() => {
    // Check if running in a secure context (HTTPS or localhost)
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setIsSecure(false);
    }
  }, []);

  const handleImageSelected = async (file: File) => {
    try {
      setAppState(AppState.ANALYZING);
      setErrorState(null);
      
      // Create local preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Convert to Base64 for Gemini
      const base64Data = await fileToGenerativePart(file);
      
      // API Call
      const extractedData = await extractDetailsFromImage(base64Data, file.type);
      
      // Save to database
      await saveScanToDatabase(extractedData);
      
      setData(extractedData);
      setAppState(AppState.SUCCESS);
    } catch (err: any) {
      console.error("Full Error Object:", err);
      
      let errorMessage = "Failed to extract data.";
      let isAuthError = false;
      
      // Robust error message extraction
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else {
        errorMessage = JSON.stringify(err);
      }

      const lowerErr = errorMessage.toLowerCase();

      // Check for 403, permission denied, or key validity issues
      if (
        lowerErr.includes('403') || 
        lowerErr.includes('permission_denied') || 
        lowerErr.includes('api key') ||
        lowerErr.includes('fetch failed') // Sometimes fetch blocks look like this
      ) {
        isAuthError = true;
      }

      setErrorState({ message: errorMessage, isAuthError });
      setAppState(AppState.ERROR);
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setData(null);
    setPreviewUrl(null);
    setErrorState(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-blue-500 selection:text-white flex flex-col">
      {/* Header / Nav */}
      <nav className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
            QuickScan
          </span>
          <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
             <span className="text-xs font-bold text-slate-400">JP</span>
          </div>
        </div>
      </nav>

      {/* Security Warning Banner */}
      {!isSecure && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-yellow-600 text-white text-xs text-center py-2 px-4">
          ⚠️ Not on HTTPS. Copy features may be limited. Please use a secure URL (ngrok/vercel) to test on phone.
        </div>
      )}

      {/* Main Content */}
      <main className="pt-24 pb-12 px-6 flex flex-col items-center flex-grow justify-center min-h-[calc(100vh-64px)]">
        
        {/* Intro Text (Only show when IDLE) */}
        {appState === AppState.IDLE && (
          <div className="text-center mb-12 animate-fade-in-down mt-[-10vh]">
            <h1 className="text-3xl font-bold mb-4">
              GCash Helper
            </h1>
            <p className="text-slate-400 max-w-xs mx-auto leading-relaxed">
              Scan a receipt photo to copy the number and open GCash instantly.
            </p>
          </div>
        )}

        {/* Loading State */}
        {appState === AppState.ANALYZING && (
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="relative w-24 h-24">
               {/* Pulsing rings */}
               <div className="absolute inset-0 border-4 border-blue-500 rounded-full animate-ping opacity-25"></div>
               <div className="absolute inset-2 border-4 border-cyan-400 rounded-full animate-spin border-t-transparent"></div>
               {previewUrl && (
                 <img 
                   src={previewUrl} 
                   alt="Analyzing" 
                   className="absolute inset-4 w-[calc(100%-32px)] h-[calc(100%-32px)] object-cover rounded-full opacity-70" 
                 />
               )}
            </div>
            <p className="text-blue-300 font-medium animate-pulse">Extracting Details...</p>
          </div>
        )}

        {/* Result State */}
        {appState === AppState.SUCCESS && data && (
          <div className="w-full flex flex-col items-center">
             {/* Thumbnail of scanned image */}
             {previewUrl && (
               <div className="mb-6 w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-700 shadow-lg">
                 <img src={previewUrl} alt="Scanned" className="w-full h-full object-cover" />
               </div>
             )}
             <ResultCard data={data} onReset={handleReset} />
          </div>
        )}

        {/* Error State */}
        {appState === AppState.ERROR && errorState && (
           <div className="w-full max-w-md bg-red-500/10 border border-red-500/50 rounded-xl p-6">
              <div className="text-center text-red-400 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-red-200 mb-2 text-center">Scan Failed</h3>
              
              {errorState.isAuthError ? (
                <div className="bg-slate-900/50 p-4 rounded-lg text-sm text-left border border-slate-700">
                  <p className="font-bold text-red-300 mb-2">Google API Error (403)</p>
                  <p className="text-slate-300 mb-3">If "Generative Language API" is missing from your list, follow these steps:</p>
                  <ol className="list-decimal pl-4 space-y-2 text-slate-400">
                    <li>Go to <strong>Google Cloud Console</strong> &gt; <strong>APIs & Services</strong> &gt; <strong>Library</strong>.</li>
                    <li>Type <strong>"Generative Language"</strong> in the search bar.</li>
                    <li>Click the result and click the blue <strong>ENABLE</strong> button.</li>
                    <li>Wait 1 minute, then go to <strong>Credentials</strong>.</li>
                    <li>Create a <strong>New API Key</strong>.</li>
                    <li>Update your <code>.env</code> file and <strong>restart the dev server</strong>.</li>
                  </ol>
                </div>
              ) : (
                <p className="text-red-200/70 text-sm mb-6 text-center break-words">{errorState.message}</p>
              )}

              <button 
                onClick={handleReset}
                className="w-full mt-6 bg-red-600 hover:bg-red-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Try Again
              </button>
           </div>
        )}

        {/* Sticky Action Button (Only show when IDLE) */}
        {appState === AppState.IDLE && (
          <div className="fixed bottom-12 left-0 right-0 z-40">
            <ScanButton onImageSelected={handleImageSelected} />
            <p className="text-center text-slate-500 text-xs mt-4">
              Tap to Scan from Gallery
            </p>
          </div>
        )}
        
        {/* Helper Notice */}
        {appState === AppState.IDLE && (
            <div className="fixed bottom-4 left-0 right-0 text-[10px] text-center text-slate-600 px-6">
                Save photo from Messenger to Gallery first
            </div>
        )}

      </main>
    </div>
  );
};

export default App;