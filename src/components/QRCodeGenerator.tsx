import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
  className?: string;
}

export const QRCodeGenerator = ({ value, size = 256, className }: QRCodeGeneratorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    }
  }, [value, size]);

  const downloadQR = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = `qr-${value.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <canvas ref={canvasRef} className="border rounded-lg" />
      <Button onClick={downloadQR} variant="outline" size="sm" className="gap-2">
        <Download className="h-4 w-4" />
        Download QR Code
      </Button>
    </div>
  );
};