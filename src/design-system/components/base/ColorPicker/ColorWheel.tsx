import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { hexToHsl, hslToHex } from './colorUtils';
import { cn } from '../../../utils';

interface ColorWheelProps {
  value: string;
  onChange: (color: string) => void;
  size?: number;
  disabled?: boolean;
}

export function ColorWheel({ 
  value, 
  onChange, 
  size = 150,
  disabled = false 
}: ColorWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const isDragging = useRef(false);
  const frameRef = useRef<number>();
  const dpr = useMemo(() => window.devicePixelRatio || 1, []);

  // Memoize HSL values
  const [h, s, l] = useMemo(() => hexToHsl(value), [value]);

  // Memoize canvas dimensions
  const dimensions = useMemo(() => ({
    width: size * dpr,
    height: size * dpr,
    radius: size / 2,
    centerX: size / 2,
    centerY: size / 2
  }), [size, dpr]);

  const drawColorWheel = useCallback((ctx: CanvasRenderingContext2D) => {
    const { radius, centerX, centerY } = dimensions;
    
    // Clear canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Create color wheel gradient
    const imageData = ctx.createImageData(size * dpr, size * dpr);
    const data = imageData.data;

    for (let y = 0; y < size * dpr; y++) {
      for (let x = 0; x < size * dpr; x++) {
        const dx = (x / dpr - centerX);
        const dy = (y / dpr - centerY);
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        const index = (y * size * dpr + x) * 4;
        
        if (distance <= radius) {
          const hue = ((angle + Math.PI) / (Math.PI * 2)) * 360;
          const saturation = (distance / radius) * 100;
          const [r, g, b] = hslToRgb(hue, saturation, l);
          
          data[index] = r;
          data[index + 1] = g;
          data[index + 2] = b;
          data[index + 3] = 255;
        } else {
          data[index + 3] = 0;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Draw current color marker
    const markerRadius = 6 * dpr;
    const markerX = centerX * dpr + (s / 100 * radius * dpr) * Math.cos(h * Math.PI / 180);
    const markerY = centerY * dpr + (s / 100 * radius * dpr) * Math.sin(h * Math.PI / 180);

    ctx.beginPath();
    ctx.arc(markerX, markerY, markerRadius, 0, Math.PI * 2);
    ctx.strokeStyle = l > 50 ? '#000000' : '#FFFFFF';
    ctx.lineWidth = 2 * dpr;
    ctx.stroke();
    ctx.fillStyle = value;
    ctx.fill();

    if (disabled) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
  }, [dimensions, value, h, s, l, size, dpr, disabled]);

  // Initialize canvas context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { 
      alpha: true,
      willReadFrequently: true 
    });
    if (!ctx) return;

    // Set canvas size with device pixel ratio
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    contextRef.current = ctx;
    drawColorWheel(ctx);

    return () => {
      cancelAnimationFrame(frameRef.current!);
      contextRef.current = null;
    };
  }, [dimensions, size, dpr, drawColorWheel]);

  const handleInteraction = useCallback((event: MouseEvent | TouchEvent) => {
    if (disabled) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (('touches' in event ? event.touches[0].clientX : event.clientX) - rect.left) * (canvas.width / rect.width);
    const y = (('touches' in event ? event.touches[0].clientY : event.clientY) - rect.top) * (canvas.height / rect.height);

    const { centerX, centerY, radius } = dimensions;
    const deltaX = (x / dpr) - centerX;
    const deltaY = (y / dpr) - centerY;

    // Calculate new hue and saturation
    const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
    const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), radius);

    const newHue = (angle + 360) % 360;
    const newSaturation = (distance / radius) * 100;

    // Use requestAnimationFrame for smooth updates
    cancelAnimationFrame(frameRef.current!);
    frameRef.current = requestAnimationFrame(() => {
      onChange(hslToHex(newHue, newSaturation, l));
    });
  }, [dimensions, onChange, l, dpr, disabled]);

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    isDragging.current = true;
    handleInteraction(event.nativeEvent);
  }, [handleInteraction, disabled]);

  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    isDragging.current = true;
    handleInteraction(event.nativeEvent);
  }, [handleInteraction, disabled]);

  // Event cleanup
  useEffect(() => {
    const handleMove = (event: MouseEvent | TouchEvent) => {
      if (!isDragging.current) return;
      event.preventDefault();
      handleInteraction(event);
    };

    const handleEnd = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [handleInteraction]);

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className={cn(
        "rounded-full touch-none select-none",
        disabled ? "cursor-not-allowed" : "cursor-pointer"
      )}
      style={{
        boxShadow: '0 0 0 1px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.1)',
        touchAction: 'none'
      }}
      role="slider"
      aria-label="Color wheel"
      aria-valuetext={`Hue: ${Math.round(h)}, Saturation: ${Math.round(s)}%`}
      aria-disabled={disabled}
    />
  );
}

// Helper function to convert HSL to RGB
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [
    Math.round(255 * f(0)),
    Math.round(255 * f(8)),
    Math.round(255 * f(4))
  ];
}