import React, { useState, useRef, useEffect, useCallback } from 'react';

interface CompareSliderProps {
  leftImage: string;
  rightImage: string;
  className?: string;
  initialPosition?: number;
}

export function CompareSlider({
  leftImage,
  rightImage,
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
      className={`relative select-none ${className}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Right Image (Result) - defines container size */}
      <img
        src={rightImage}
        alt="Result"
        className="block max-w-full max-h-[75vh] w-auto h-auto object-contain pointer-events-none select-none"
        draggable={false}
      />

      {/* Left Image (Original) - overlaid with clip-path */}
      <img
        src={leftImage}
        alt="Original"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        draggable={false}
      />

      {/* Slider Handle */}
      <div
        className="absolute inset-y-0 w-0.5 bg-primary cursor-ew-resize z-20 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-primary rounded-full shadow-lg flex items-center justify-center text-background">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18-6-6 6-6"/>
            <path d="m15 6 6 6-6 6"/>
          </svg>
        </div>
      </div>
    </div>
  );
}
