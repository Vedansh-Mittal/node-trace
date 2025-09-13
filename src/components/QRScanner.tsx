import { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QRScannerProps {
  onScan: (result: string) => void;
  className?: string;
}

export const QRScanner = ({ onScan, className }: QRScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanner, setScanner] = useState<QrScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    QrScanner.hasCamera().then(setHasCamera);
    
    return () => {
      if (scanner) {
        scanner.destroy();
      }
    };
  }, [scanner]);

  const startScanning = async () => {
    if (!videoRef.current) return;

    try {
      const qrScanner = new QrScanner(
        videoRef.current,
        result => {
          onScan(result.data);
          toast({
            title: "QR Code Scanned",
            description: `Batch ID: ${result.data}`,
          });
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      await qrScanner.start();
      setScanner(qrScanner);
      setIsScanning(true);
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Failed to access camera. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopScanning = () => {
    if (scanner) {
      scanner.stop();
      scanner.destroy();
      setScanner(null);
      setIsScanning(false);
    }
  };

  if (!hasCamera) {
    return (
      <div className={`text-center space-y-4 ${className}`}>
        <div className="w-64 h-64 mx-auto bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/25">
          <div className="text-center space-y-2">
            <CameraOff className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No camera available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`text-center space-y-4 ${className}`}>
      <div className="relative w-64 h-64 mx-auto bg-muted rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/25">
        {isScanning ? (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center space-y-2">
              <QrCode className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Ready to scan</p>
            </div>
          </div>
        )}
      </div>
      
      <Button
        onClick={isScanning ? stopScanning : startScanning}
        variant={isScanning ? "destructive" : "default"}
        className="gap-2"
      >
        {isScanning ? (
          <>
            <CameraOff className="h-4 w-4" />
            Stop Camera
          </>
        ) : (
          <>
            <Camera className="h-4 w-4" />
            Start Camera
          </>
        )}
      </Button>
    </div>
  );
};