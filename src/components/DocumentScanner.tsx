import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, ScanLine, Loader2, UploadCloud, ShieldCheck } from 'lucide-react';

interface DocumentScannerProps {
  onScanComplete: (data: { name?: string; birthDate?: string }) => void;
  onClose: () => void;
}

export const DocumentScanner: React.FC<DocumentScannerProps> = ({ onScanComplete, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError('تعذر الوصول إلى الكاميرا. يمكنك رفع صورة بدلاً من ذلك.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleSimulateOCR = () => {
    setIsScanning(true);
    // Mock OCR process with Tesseract.js simulation
    setTimeout(() => {
      setIsScanning(false);
      stopCamera();
      // Generate some mock extracted data
      onScanComplete({
        name: 'أحمد محمود',
        birthDate: '2015-05-12' // Example data
      });
    }, 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleSimulateOCR(); // simulate processing the uploaded file
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between z-10 bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center gap-2 text-white">
            <ScanLine size={18} className="text-cyan-400" />
            <h3 className="font-bold text-sm">الماسح الضوئي الذكي (OCR)</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Viewfinder area */}
        <div className="relative bg-black aspect-[3/4] flex items-center justify-center overflow-hidden">
          {error && !isScanning ? (
            <div className="text-center p-6 text-slate-400">
              <ShieldCheck size={48} className="mx-auto mb-4 text-slate-600 opacity-50" />
              <p className="text-sm">{error}</p>
            </div>
          ) : (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            />
          )}

          {/* Viewfinder Overlay (Glassmorphism + clean lines) */}
          <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
            <div className="w-full h-full border-[2px] border-white/20 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
              {/* Corner brackets */}
              <div className="absolute -top-[2px] -left-[2px] w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-2xl"></div>
              <div className="absolute -top-[2px] -right-[2px] w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-2xl"></div>
              <div className="absolute -bottom-[2px] -left-[2px] w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-2xl"></div>
              <div className="absolute -bottom-[2px] -right-[2px] w-8 h-8 border-b-4 border-r-4 border-white rounded-br-2xl"></div>
              
              {/* Scanning animation line */}
              {isScanning && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
              )}
            </div>
          </div>

          {/* Scanning Overlay State */}
          {isScanning && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
              <Loader2 size={32} className="animate-spin text-cyan-400 mb-3" />
              <p className="text-sm font-bold tracking-widest text-cyan-50">جاري قراءة البيانات...</p>
              <p className="text-xs text-slate-400 mt-1">يرجى الانتظار (Tesseract.js)</p>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-5 bg-slate-900 border-t border-slate-800 flex flex-col gap-3">
          <button 
            onClick={handleSimulateOCR}
            disabled={isScanning || !!error}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          >
            <Camera size={18} />
            <span>التقاط ومسح المستند</span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-800"></div>
            <span className="text-xs text-slate-500 font-medium">أو</span>
            <div className="flex-1 h-px bg-slate-800"></div>
          </div>

          <input 
            type="file" 
            accept="image/*"
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 border border-slate-700"
          >
            <UploadCloud size={16} className="text-slate-400" />
            <span className="text-sm text-slate-300">رفع صورة من الجهاز</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(300px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
