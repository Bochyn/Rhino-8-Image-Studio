import React, { useState, useRef, useEffect, useCallback } from 'react';

interface CompareSliderProps {
  leftImage: string;
  rightImage: string;
  leftLabel?: string;
  rightLabel?: string;
  className?: string;
  initialPosition?: number;
}

export function CompareSlider({
  leftImage,
  rightImage,
  leftLabel = 'Before',
  rightLabel = 'After',
  className = '',
  initialPosition = 50,
}: CompareSliderProps) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setPosition(percent);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    handleMove(e.clientX);
  }, [handleMove]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    handleMove(e.touches[0].clientX);
  }, [handleMove]);

  useEffect(() => {
    const handleWindowMove = (e: MouseEvent) => {
      if (isDragging) {
        handleMove(e.clientX);
      }
    };
    const handleWindowUp = () => {
      setIsDragging(false);
    };

    const handleWindowTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        handleMove(e.touches[0].clientX);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleWindowMove);
      window.addEventListener('mouseup', handleWindowUp);
      window.addEventListener('touchmove', handleWindowTouchMove);
      window.addEventListener('touchend', handleWindowUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleWindowMove);
      window.removeEventListener('mouseup', handleWindowUp);
      window.removeEventListener('touchmove', handleWindowTouchMove);
      window.removeEventListener('touchend', handleWindowUp);
    };
  }, [isDragging, handleMove]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full select-none overflow-hidden group ${className}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Right Image (Background/After) */}
      <img
        src={rightImage}
        alt={rightLabel}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
        draggable={false}
      />
      
      {/* Right Label */}
      <div className="absolute top-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm pointer-events-none z-10">
        {rightLabel}
      </div>

      {/* Left Image (Foreground/Before) - Clipped */}
      <div 
        className="absolute inset-0 h-full overflow-hidden pointer-events-none select-none"
        style={{ width: `${position}%` }}
      >
        <img
          src={leftImage}
          alt={leftLabel}
          className="absolute inset-0 w-full h-full object-contain max-w-none"
          // Note: max-w-none is critical here to prevent the image from squishing
          // However, to make it perfectly align with the underlying image, we need to know the container size vs image size
          // For object-contain, this is tricky without knowing the aspect ratio.
          // A safer approach for exact alignment in 'contain' mode is using background-image or more complex calculations.
          // BUT: given the requirements, let's assume images are same dimensions or handled via a container.
          // To fix the alignment issue in object-contain mode:
          // We can't easily do this with pure CSS img tags if aspect ratios differ or match container.
          // Let's assume the parent handles the sizing (e.g. CanvasStage) and passes images that fit.
          // Actually, `object-fit: contain` centers the image. If both are `object-contain` and same aspect ratio, they overlap perfectly.
          // The clipping div needs to match the container.
          // The inner img needs to be full width of the CONTAINER, not the clipping div.
          style={{ width: containerRef.current?.offsetWidth || '100%' }}
          draggable={false}
        />
        {/* Left Label */}
        <div className="absolute top-4 left-4 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm z-10">
          {leftLabel}
        </div>
      </div>

      {/* Slider Handle */}
      <div 
        className="absolute inset-y-0 w-0.5 bg-white cursor-ew-resize z-20 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-900">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18-6-6 6-6"/>
            <path d="m15 6 6 6-6 6"/>
          </svg>
        </div>
      </div>
    </div>
  );
}
