import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import JsBarcode from 'jsbarcode';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Camera, Volume2, Sparkles, CheckCircle2, ExternalLink, Printer } from 'lucide-react';
import { Product } from '../../types';

export interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (code: string) => void;
  sampleProducts?: Product[];
}

const BarcodeCard: React.FC<{
  product: Product;
  onScan: (code: string) => void;
}> = ({ product, onScan }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current) {
      try {
        JsBarcode(svgRef.current, product.barcode, {
          format: 'CODE128',
          width: 1.8,
          height: 44,
          displayValue: true,
          font: 'monospace',
          fontSize: 11,
          textMargin: 2,
          lineColor: '#0f172a',
        });
      } catch {
        // Fallback
      }
    }
  }, [product.barcode]);

  return (
    <div
      onClick={() => onScan(product.barcode)}
      className="p-2.5 bg-white hover:bg-emerald-50/70 hover:border-emerald-500 border-2 border-slate-200 rounded-xl cursor-pointer transition-all shadow-2xs group flex flex-col items-center"
      title="Click to simulate scan, or aim scanner gun at this barcode"
    >
      <div className="w-full flex justify-between items-center mb-1">
        <span className="font-black text-xs text-slate-900 group-hover:text-emerald-800 truncate">
          {product.name}
        </span>
        <span className="font-mono text-xs font-black text-emerald-700 ml-1">
          ₱{parseFloat(product.selling_price.toString()).toFixed(2)}
        </span>
      </div>
      <div className="w-full bg-slate-50 p-1 rounded-lg border border-slate-200 flex justify-center">
        <svg ref={svgRef} className="max-w-full" />
      </div>
      <span className="text-[9px] text-slate-400 font-mono mt-1 font-bold group-hover:text-emerald-700">
        Aim scanner or click to add
      </span>
    </div>
  );
};

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  sampleProducts = [],
}) => {
  const [cameraError, setCameraError] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [lastScanned, setLastScanned] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'camera' | 'sheet'>('camera');
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
      setIsScanning(false);
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
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: { width: 280, height: 160 },
            aspectRatio: 1.777778,
          },
          (decodedText) => {
            setLastScanned(decodedText);
            onScanSuccess(decodedText);
          },
          () => {}
        );

        setIsScanning(true);
      } catch (err: any) {
        console.warn('Camera notice:', err);
        setCameraError(
          err?.message ||
            'Camera preview unavailable on this device. You can still scan the live barcodes below using your USB/Bluetooth barcode gun or click them directly.'
        );
      }
    };

    const timer = setTimeout(startCamera, 200);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Barcode Scanner & Live Samples"
      subtitle="Point camera at product barcode or aim scanner gun at the barcodes below"
      maxWidth="xl"
      darkTheme={false}
    >
      <div className="space-y-4 text-slate-900">
        {/* Sub-tab switcher */}
        <div className="flex items-center gap-2 border-b-2 border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'camera'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Live Camera Viewfinder</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sheet')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'sheet'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Scannable Barcodes ({sampleProducts.length})</span>
          </button>

          <a
            href="/barcodes.html"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1"
            title="Open printable barcode test sheet in a new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open Test Sheet</span>
          </a>
        </div>

        {/* VIEW 1: Live Camera Viewfinder */}
        {activeTab === 'camera' && (
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-800 shadow-inner min-h-[220px] flex items-center justify-center">
              <div id="klaropos-reader" className="w-full h-full" />

              {isScanning && (
                <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center">
                  <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_12px_#10b981] animate-pulse" />
                  <span className="text-[10px] font-mono font-bold text-emerald-300 mt-2 bg-slate-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40">
                    ALIGN BARCODE INSIDE RETICLE
                  </span>
                </div>
              )}

              {cameraError && (
                <div className="p-6 text-center text-slate-400 max-w-sm space-y-2">
                  <Camera className="w-10 h-10 mx-auto text-slate-600 mb-1" />
                  <p className="text-xs font-bold text-slate-300">Camera Unavailable</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {cameraError}
                  </p>
                </div>
              )}
            </div>

            {/* Scanned Feedback */}
            {lastScanned && (
              <div className="p-2.5 bg-emerald-50 border-2 border-emerald-400 text-emerald-950 rounded-xl flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold">
                    Scanned: <span className="font-mono text-emerald-800">{lastScanned}</span>
                  </span>
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded">
                  Added to Cart
                </span>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: Scannable Barcode Cards */}
        <div className={activeTab === 'sheet' ? 'block' : 'mt-3'}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Aim your barcode scanner gun at any barcode below:</span>
            </span>
            <span className="text-[10px] font-bold text-slate-400">Audio Beep Active</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
            {sampleProducts.slice(0, 9).map((prod) => (
              <BarcodeCard
                key={prod.product_id}
                product={prod}
                onScan={(code) => {
                  setLastScanned(code);
                  onScanSuccess(code);
                }}
              />
            ))}
          </div>
        </div>

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
