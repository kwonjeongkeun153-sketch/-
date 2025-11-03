import React, { useState, useRef, useCallback, MouseEvent, TouchEvent } from 'react';
import { DownloadIcon, ZoomInIcon, ZoomOutIcon, ResetZoomIcon } from './Icons';

interface ImageComparatorProps {
  beforeImage: string;
  afterImage: string;
}

export const ImageComparator: React.FC<ImageComparatorProps> = ({ beforeImage, afterImage }) => {
  // Slider state
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Zoom and Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // --- SLIDER LOGIC ---
  const handleMoveSlider = useCallback((clientX: number) => {
    if (!isDraggingSlider || !imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPosition(percent);
  }, [isDraggingSlider]);

  const handleMouseDownSlider = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingSlider(true);
  };
  
  const handleTouchStartSlider = (e: TouchEvent) => {
    e.stopPropagation();
    setIsDraggingSlider(true);
  };

  const handleMouseUpSlider = useCallback(() => {
    setIsDraggingSlider(false);
  }, []);

  const handleMouseMoveSlider = useCallback((e: globalThis.MouseEvent) => {
    handleMoveSlider(e.clientX);
  }, [handleMoveSlider]);
  
  const handleTouchMoveSlider = useCallback((e: globalThis.TouchEvent) => {
      handleMoveSlider(e.touches[0].clientX);
  }, [handleMoveSlider]);

  React.useEffect(() => {
    if (isDraggingSlider) {
      document.addEventListener('mousemove', handleMouseMoveSlider);
      document.addEventListener('mouseup', handleMouseUpSlider);
      document.addEventListener('touchmove', handleTouchMoveSlider);
      document.addEventListener('touchend', handleMouseUpSlider);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMoveSlider);
      document.removeEventListener('mouseup', handleMouseUpSlider);
      document.removeEventListener('touchmove', handleTouchMoveSlider);
      document.removeEventListener('touchend', handleMouseUpSlider);
    };
  }, [isDraggingSlider, handleMouseMoveSlider, handleMouseUpSlider, handleTouchMoveSlider]);


  // --- ZOOM & PAN LOGIC ---
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => {
    setZoom(prev => {
        const newZoom = Math.max(prev - 0.25, 1);
        if (newZoom <= 1) {
            setPan({ x: 0, y: 0 });
        }
        return newZoom;
    });
  };
  const handleResetZoom = () => {
      setZoom(1);
      setPan({ x: 0, y: 0 });
  };

  const handlePanStart = (e: MouseEvent | TouchEvent) => {
    if (zoom <= 1 || isDraggingSlider) return;
    e.preventDefault();
    setIsPanning(true);
    const point = 'touches' in e ? e.touches[0] : e;
    panStartRef.current = {
      x: point.clientX - pan.x,
      y: point.clientY - pan.y,
    };
  };

  const handlePanEnd = useCallback(() => setIsPanning(false), []);

  const handlePanMove = useCallback((e: globalThis.MouseEvent | globalThis.TouchEvent) => {
    if (!isPanning || !imageContainerRef.current) return;
    
    e.preventDefault();
    const point = 'touches' in e ? e.touches[0] : e;
    const rect = imageContainerRef.current.getBoundingClientRect();

    const maxPanX = Math.max(0, (rect.width * zoom - rect.width) / 2) / zoom;
    const maxPanY = Math.max(0, (rect.height * zoom - rect.height) / 2) / zoom;
    
    const newX = point.clientX - panStartRef.current.x;
    const newY = point.clientY - panStartRef.current.y;
    
    setPan({
      x: Math.max(-maxPanX, Math.min(maxPanX, newX)),
      y: Math.max(-maxPanY, Math.min(maxPanY, newY)),
    });
  }, [isPanning, zoom]);

  React.useEffect(() => {
    if (isPanning) {
      document.addEventListener('mousemove', handlePanMove);
      document.addEventListener('mouseup', handlePanEnd);
      document.addEventListener('touchmove', handlePanMove, { passive: false });
      document.addEventListener('touchend', handlePanEnd);
    }
    return () => {
      document.removeEventListener('mousemove', handlePanMove);
      document.removeEventListener('mouseup', handlePanEnd);
      document.removeEventListener('touchmove', handlePanMove);
      document.removeEventListener('touchend', handlePanEnd);
    };
  }, [isPanning, handlePanMove, handlePanEnd]);


  // --- MISC ---
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = afterImage;
    const mimeType = afterImage.split(';')[0].split(':')[1] || 'image/png';
    const extension = mimeType.split('/')[1] || 'png';
    link.download = `photo-enhancer-ai-enhanced.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const imageStyle: React.CSSProperties = {
    transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
    transition: isPanning ? 'none' : 'transform 0.1s ease-out',
    willChange: 'transform',
    maxWidth: '100%',
    maxHeight: '100%',
  };
  
  const containerCursor = zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default';

  return (
    <div 
      className="relative w-full h-full select-none animate-fade-in group overflow-hidden" 
      ref={imageContainerRef}
      onMouseDown={handlePanStart}
      onTouchStart={handlePanStart}
      style={{ cursor: containerCursor }}
    >
      <img src={beforeImage} alt="Before" className="absolute inset-0 w-full h-full object-contain pointer-events-none" draggable="false" style={imageStyle} />
      <div
        className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img src={afterImage} alt="After" className="absolute inset-0 w-full h-full object-contain pointer-events-none" draggable="false" style={imageStyle} />
      </div>
      <div className="absolute top-0 left-0 p-2 bg-black/50 text-white text-xs font-bold rounded-br-md z-10">BEFORE</div>
      <div 
        className="absolute top-0 right-0 p-2 bg-black/50 text-white text-xs font-bold rounded-bl-md z-10"
        style={{ opacity: sliderPosition > 80 ? 1 : 0, transition: 'opacity 0.3s' }}
      >
        AFTER
      </div>
      
      {/* --- Slider Handle --- */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white/50 cursor-ew-resize backdrop-blur-sm z-10"
        style={{ left: `calc(${sliderPosition}% - 2px)` }}
        onMouseDown={handleMouseDownSlider}
        onTouchStart={handleTouchStartSlider}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-10 w-10 rounded-full bg-white/80 shadow-lg flex items-center justify-center backdrop-blur-md">
          <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
        </div>
      </div>
      
      {/* --- Action Buttons --- */}
      <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button 
          onClick={handleDownload}
          className="p-2 bg-gray-800/70 rounded-full text-gray-200 hover:bg-gray-700 hover:text-white transition-all backdrop-blur-sm"
          aria-label="Download enhanced image"
          title="Download enhanced image"
        >
          <DownloadIcon className="w-5 h-5"/>
        </button>
      </div>

      {/* --- Zoom Controls --- */}
      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 bg-gray-900/60 p-1.5 rounded-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button
            onClick={handleZoomOut}
            disabled={zoom <= 1}
            className="p-1.5 rounded-md text-gray-200 hover:bg-white/20 disabled:text-gray-500 disabled:hover:bg-transparent transition-colors"
            title="Zoom out"
        >
            <ZoomOutIcon className="w-5 h-5"/>
        </button>
        <button
            onClick={handleResetZoom}
            disabled={zoom <= 1}
            className="p-1.5 rounded-md text-gray-200 hover:bg-white/20 disabled:text-gray-500 disabled:hover:bg-transparent transition-colors"
            title="Reset zoom"
        >
            <ResetZoomIcon className="w-5 h-5"/>
        </button>
        <button
            onClick={handleZoomIn}
            disabled={zoom >= 4}
            className="p-1.5 rounded-md text-gray-200 hover:bg-white/20 disabled:text-gray-500 disabled:hover:bg-transparent transition-colors"
            title="Zoom in"
        >
            <ZoomInIcon className="w-5 h-5"/>
        </button>
      </div>
    </div>
  );
};
