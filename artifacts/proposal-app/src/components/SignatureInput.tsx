import { useRef, useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Upload, Eraser } from 'lucide-react';

interface SignatureInputProps {
  value: string;
  onChange: (dataUrl: string) => void;
}

// A signature is stored as a base64 data URL image, produced either by
// uploading an image file or by drawing on a canvas. Used identically
// everywhere the signature is rendered (Review, Preview, DOCX, PDF).
export function isSignatureImage(value: string | undefined): boolean {
  return !!value && value.startsWith('data:image');
}

export function SignatureInput({ value, onChange }: SignatureInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const handleUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawing.current = true;
    const ctx = canvas.getContext('2d');
    const { x, y } = getPos(e, canvas);
    ctx?.beginPath();
    ctx?.moveTo(x, y);
  };

  const moveDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e, canvas);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111827';
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const endDraw = () => {
    drawing.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const saveDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onChange(canvas.toDataURL('image/png'));
  };

  return (
    <div className="space-y-3">
      {isSignatureImage(value) && (
        <div className="border border-gray-200 rounded-md p-3 bg-gray-50 inline-block">
          <p className="text-xs text-gray-500 mb-2">Current signature</p>
          {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
          <img src={value} alt="Signature preview" data-testid="img-signature-preview" className="h-16 object-contain" />
        </div>
      )}

      <Tabs defaultValue="upload">
        <TabsList>
          <TabsTrigger value="upload" data-testid="tab-signature-upload">Upload Image</TabsTrigger>
          <TabsTrigger value="draw" data-testid="tab-signature-draw">Draw Signature</TabsTrigger>
        </TabsList>
        <TabsContent value="upload" className="pt-3">
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} data-testid="button-signature-upload">
            <Upload className="w-4 h-4 mr-2" />
            Choose Image
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = '';
            }}
          />
        </TabsContent>
        <TabsContent value="draw" className="pt-3 space-y-2">
          <canvas
            ref={canvasRef}
            width={300}
            height={120}
            className="border border-gray-300 rounded-md bg-white touch-none cursor-crosshair"
            data-testid="canvas-signature-draw"
            onMouseDown={startDraw}
            onMouseMove={moveDraw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={moveDraw}
            onTouchEnd={endDraw}
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={clearCanvas} data-testid="button-signature-clear">
              <Eraser className="w-4 h-4 mr-2" />
              Clear
            </Button>
            <Button type="button" size="sm" onClick={saveDrawing} disabled={!hasDrawn} data-testid="button-signature-save">
              Save Signature
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
