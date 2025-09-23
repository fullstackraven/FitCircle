import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, CameraOff, X } from 'lucide-react';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult: (barcode: string) => void;
}

export default function BarcodeScanner({ isOpen, onClose, onScanResult }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    if (isOpen) {
      startScanning();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen]);

  const startScanning = async () => {
    try {
      setError(null);
      setIsScanning(true);

      // Initialize the code reader
      codeReaderRef.current = new BrowserMultiFormatReader();

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Start decoding from the video stream
        codeReaderRef.current.decodeFromVideoDevice(null, videoRef.current, (result, error) => {
          if (result) {
            console.log('Barcode detected:', result.getText());
            onScanResult(result.getText());
            stopScanning();
            onClose();
          }
          
          if (error && !(error instanceof NotFoundException)) {
            console.warn('Barcode scanning error:', error);
          }
        });
      }
    } catch (err) {
      console.error('Error starting barcode scanner:', err);
      setHasPermission(false);
      setError(err instanceof Error ? err.message : 'Failed to access camera');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
  };

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  const requestPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setHasPermission(true);
      startScanning();
    } catch (err) {
      setHasPermission(false);
      setError('Camera permission denied');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-gray-800 border-gray-600 text-white rounded-xl max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Camera className="w-5 h-5" />
              <span>Scan Barcode</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-gray-400 hover:text-white hover:bg-gray-700 rounded-xl"
              data-testid="button-close-scanner"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {hasPermission === null && (
            <div className="text-center py-8">
              <Camera className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-300 mb-4">Camera access is required to scan barcodes</p>
              <Button
                onClick={requestPermission}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                data-testid="button-request-camera"
              >
                Enable Camera
              </Button>
            </div>
          )}

          {hasPermission === false && (
            <div className="text-center py-8">
              <CameraOff className="w-12 h-12 mx-auto text-red-400 mb-4" />
              <p className="text-red-300 mb-2">Camera access denied</p>
              <p className="text-gray-400 text-sm mb-4">
                Please enable camera permission in your browser settings and try again
              </p>
              <Button
                onClick={requestPermission}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                data-testid="button-retry-camera"
              >
                Try Again
              </Button>
            </div>
          )}

          {error && (
            <div className="text-center py-4">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {hasPermission === true && (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 bg-black rounded-xl object-cover"
                data-testid="video-scanner"
              />
              
              {/* Scanner overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-4 border-2 border-white/50 rounded-xl">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-xl"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-xl"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-xl"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-xl"></div>
                </div>
              </div>

              <div className="text-center mt-4">
                <p className="text-gray-300 text-sm">
                  Position the barcode within the frame to scan
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}