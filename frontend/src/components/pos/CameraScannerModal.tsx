import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Camera, X, Volume2, Sparkles, CheckCircle2 } from 'lucide-react';
import { Product } from '../../types';

export interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (code: string) => void;
  sampleProducts?: Product[];
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  sampleProducts = [],
}) => {
  const [cameraError, setCameraError] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [lastScanned, setLastScanned] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Stop scanner if closing
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
      setIsScanning(false);
      setLastScanned('');
      setCameraError('');
      return;
    }

    const elementId = 'klaropos-reader';

    const startCamera = async () => {
      try {
        const formatsToSupport = [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.QR_CODE,
        ];

        const html5QrCode = new Html5Qrcode(elementId, {
          formatsToSupport,
          verbose: false,
        });
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' }, // Back camera preferred on phones/tablets
          {
            fps: 15,
            qrbox: { width: 280, height: 160 },
            aspectRatio: 1.777778,
          },
          (decodedText) => {
            // Success callback
            setLastScanned(decodedText);
            onScanSuccess(decodedText);
          },
          () => {
            // Frame parse error (ignore frame misses)
          }
        );

        setIsScanning(true);
      } catch (err: any) {
        console.warn('Camera initialization note:', err);
        setCameraError(
          err?.message ||
            'Camera access unavailable. You can still test scanning using the sample barcodes below or a USB barcode gun.'
        );
      }
    };

    // Small delay to allow DOM modal to render #klaropos-reader
    const timer = setTimeout(startCamera, 200);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => {});
        }
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Barcode Scanner"
      subtitle="Point camera at product barcode or tap test barcodes below"
      maxWidth="lg"
      darkTheme={false}
    >
      <div className="space-y-4 text-slate-900">
        {/* Camera Viewfinder Box */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-800 shadow-inner min-h-[220px] flex items-center justify-center">
          <div id="klaropos-reader" className="w-full h-full" />

          {/* Animated Green Laser Aiming Line */}
          {isScanning && (
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center">
              <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_12px_#10b981] animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-emerald-300 mt-2 bg-slate-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40">
                ALIGN BARCODE INSIDE VIEWFINDER
              </span>
            </div>
          )}

          {cameraError && (
            <div className="p-6 text-center text-slate-400 max-w-sm space-y-2">
              <Camera className="w-10 h-10 mx-auto text-slate-600 mb-1" />
              <p className="text-xs font-bold text-slate-300">Camera Viewfinder</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {cameraError}
              </p>
            </div>
          )}
        </div>

        {/* Scan Status Feedback */}
        {lastScanned && (
          <div className="p-3 bg-emerald-50 border-2 border-emerald-400 text-emerald-950 rounded-xl flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="text-xs font-black">Barcode Scanned:</span>
                <span className="font-mono text-xs font-bold ml-1 text-emerald-800">{lastScanned}</span>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded">
              Added to Cart
            </span>
          </div>
        )}

        {/* Quick Test Barcodes (Instant Simulator) */}
        {sampleProducts.length > 0 && (
          <div className="p-3 bg-slate-50 rounded-xl border-2 border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Quick Test Barcodes (Click to Scan):</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400">Audio Beep Enabled</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {sampleProducts.slice(0, 6).map((prod) => (
                <button
                  key={prod.product_id}
                  type="button"
                  onClick={() => {
                    setLastScanned(prod.barcode);
                    onScanSuccess(prod.barcode);
                  }}
                  className="p-2 bg-white hover:bg-emerald-50 hover:border-emerald-500 border-2 border-slate-200 rounded-lg text-left transition-all group shadow-2xs active:scale-95"
                >
                  <div className="font-black text-xs text-slate-900 truncate group-hover:text-emerald-800">
                    {prod.name}
                  </div>
                  <div className="font-mono text-[10px] text-slate-500 truncate mt-0.5">
                    {prod.barcode}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Modal Controls */}
        <div className="flex justify-between items-center pt-2 border-t-2 border-slate-200">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Volume2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-[11px]">Hardware Gun & Camera Ready</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Close Scanner
          </Button>
        </div>
      </div>
    </Modal>
  );
};
