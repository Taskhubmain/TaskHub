import { useState, useRef, useEffect } from 'react';
import { X, RotateCw, FlipHorizontal, Crop, Check } from 'lucide-react';
import { Button } from './ui/button';

interface MediaEditorProps {
  file: File;
  onSave: (editedFile: File) => void;
  onCancel: () => void;
}

export function MediaEditor({ file, onSave, onCancel }: MediaEditorProps) {
  const [rotation, setRotation] = useState(0);
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [cropMode, setCropMode] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const isVideo = file.type.startsWith('video/');

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!isVideo && imageUrl && imageLoaded) {
      drawCanvas();
    }
  }, [rotation, flipHorizontal, imageUrl, isVideo, imageLoaded]);

  useEffect(() => {
    if (cropMode && imageLoaded) {
      drawCanvas();
      drawCropOverlay();
    }
  }, [cropMode, cropArea]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !img.complete) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rotRad = (rotation * Math.PI) / 180;
    const isRotated90 = rotation % 180 !== 0;

    canvas.width = isRotated90 ? img.naturalHeight : img.naturalWidth;
    canvas.height = isRotated90 ? img.naturalWidth : img.naturalHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rotRad);
    ctx.scale(flipHorizontal ? -1 : 1, 1);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();

    if (!cropMode) {
      const displayCanvas = displayCanvasRef.current;
      if (displayCanvas) {
        const displayCtx = displayCanvas.getContext('2d');
        if (displayCtx) {
          displayCanvas.width = canvas.width;
          displayCanvas.height = canvas.height;
          displayCtx.drawImage(canvas, 0, 0);
        }
      }
    }
  };

  const drawCropOverlay = () => {
    const displayCanvas = displayCanvasRef.current;
    const canvas = canvasRef.current;
    if (!displayCanvas || !canvas) return;

    const ctx = displayCanvas.getContext('2d');
    if (!ctx) return;

    displayCanvas.width = canvas.width;
    displayCanvas.height = canvas.height;
    ctx.drawImage(canvas, 0, 0);

    if (cropArea.width > 0 && cropArea.height > 0) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.clearRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
      ctx.drawImage(canvas, cropArea.x, cropArea.y, cropArea.width, cropArea.height,
                    cropArea.x, cropArea.y, cropArea.width, cropArea.height);

      ctx.strokeStyle = '#6FE7C8';
      ctx.lineWidth = 2;
      ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cropMode) return;
    const canvas = displayCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setIsDragging(true);
    setDragStart({ x, y });
    setCropArea({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cropMode || !isDragging) return;
    const canvas = displayCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;

    const width = currentX - dragStart.x;
    const height = currentY - dragStart.y;

    setCropArea({
      x: width < 0 ? currentX : dragStart.x,
      y: height < 0 ? currentY : dragStart.y,
      width: Math.abs(width),
      height: Math.abs(height),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleFlip = () => {
    setFlipHorizontal((prev) => !prev);
  };

  const handleCropToggle = () => {
    if (cropMode && cropArea.width > 0 && cropArea.height > 0) {
      applyCrop();
    } else {
      const canvas = canvasRef.current;
      if (canvas) {
        setCropArea({ x: 0, y: 0, width: canvas.width, height: canvas.height });
      }
      setCropMode(!cropMode);
    }
  };

  const applyCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas || cropArea.width === 0 || cropArea.height === 0) return;

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = cropArea.width;
    croppedCanvas.height = cropArea.height;
    const ctx = croppedCanvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      canvas,
      cropArea.x, cropArea.y, cropArea.width, cropArea.height,
      0, 0, cropArea.width, cropArea.height
    );

    const tempImg = new Image();
    tempImg.onload = () => {
      if (imgRef.current) {
        imgRef.current.src = croppedCanvas.toDataURL();
        setRotation(0);
        setFlipHorizontal(false);
        setCropMode(false);
        setCropArea({ x: 0, y: 0, width: 0, height: 0 });
      }
    };
    tempImg.src = croppedCanvas.toDataURL();
  };

  const handleSave = async () => {
    if (isVideo) {
      onSave(file);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const editedFile = new File([blob], file.name, {
        type: file.type,
        lastModified: Date.now(),
      });
      onSave(editedFile);
    }, file.type);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">
          {isVideo ? 'Предпросмотр видео' : 'Редактировать изображение'}
        </h3>
        <Button variant="ghost" size="sm" onClick={onCancel} className="hover:bg-gray-100">
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-4 bg-gray-50 overflow-hidden"
      >
        {isVideo ? (
          <video src={imageUrl} controls className="max-w-full max-h-full rounded-lg shadow-lg" />
        ) : (
          <>
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Preview"
              className="hidden"
              onLoad={() => {
                setImageLoaded(true);
                drawCanvas();
              }}
            />
            <canvas
              ref={displayCanvasRef}
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              style={{ cursor: cropMode ? 'crosshair' : 'default' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
            <canvas ref={canvasRef} className="hidden" />
          </>
        )}
      </div>

      {!isVideo && (
        <div className="border-t bg-white p-4">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRotate}
              className="hover:bg-[#EFFFF8] hover:text-[#3F7F6E] hover:border-[#3F7F6E]"
            >
              <RotateCw className="h-4 w-4 mr-2" />
              Повернуть вправо
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFlip}
              className="hover:bg-[#EFFFF8] hover:text-[#3F7F6E] hover:border-[#3F7F6E]"
            >
              <FlipHorizontal className="h-4 w-4 mr-2" />
              Зеркалить
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCropToggle}
              className={`hover:bg-[#EFFFF8] hover:text-[#3F7F6E] hover:border-[#3F7F6E] ${
                cropMode ? 'bg-[#EFFFF8] text-[#3F7F6E] border-[#3F7F6E]' : ''
              }`}
            >
              <Crop className="h-4 w-4 mr-2" />
              {cropMode ? 'Применить обрезку' : 'Обрезать'}
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-4 p-4 border-t bg-white">
        <Button variant="outline" onClick={onCancel} className="min-w-[120px]">
          Отмена
        </Button>
        <Button onClick={handleSave} className="min-w-[120px] bg-[#3F7F6E] hover:bg-[#2d5f52] text-white">
          <Check className="h-4 w-4 mr-2" />
          Отправить
        </Button>
      </div>
    </div>
  );
}
