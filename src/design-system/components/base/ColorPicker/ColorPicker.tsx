import React, { useState, useCallback } from 'react';
import { Palette, Copy, Check, RefreshCw } from 'lucide-react';
import { cn } from '../../../utils';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

const PRESET_COLORS = {
  'Gray': ['#F8F9FA', '#E9ECEF', '#DEE2E6', '#CED4DA', '#ADB5BD', '#6C757D', '#495057', '#343A40', '#212529'],
  'Blue': ['#EFF6FF', '#DBEAFE', '#BFDBFE', '#93C5FD', '#60A5FA', '#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF'],
  'Green': ['#F0FDF4', '#DCFCE7', '#BBF7D0', '#86EFAC', '#4ADE80', '#22C55E', '#16A34A', '#15803D', '#166534'],
  'Red': ['#FEF2F2', '#FEE2E2', '#FECACA', '#FCA5A5', '#F87171', '#EF4444', '#DC2626', '#B91C1C', '#991B1B'],
  'Purple': ['#FAF5FF', '#F3E8FF', '#E9D5FF', '#D8B4FE', '#C084FC', '#A855F7', '#9333EA', '#7E22CE', '#6B21A8'],
  'Orange': ['#FFF7ED', '#FFEDD5', '#FED7AA', '#FDBA74', '#FB923C', '#F97316', '#EA580C', '#C2410C', '#9A3412'],
};

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return [h * 360, s * 100, l * 100];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [r * 255, g * 255, b * 255].map(Math.round) as [number, number, number];
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) throw new Error('Invalid hex color');
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function getHarmonyColors(hex: string): string[] {
  const [r, g, b] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  
  // Generate complementary, analogous, and triadic colors
  return [
    // Complementary
    rgbToHex(...hslToRgb((h + 180) % 360, s, l)),
    // Analogous
    rgbToHex(...hslToRgb((h + 30) % 360, s, l)),
    rgbToHex(...hslToRgb((h - 30 + 360) % 360, s, l)),
    // Triadic
    rgbToHex(...hslToRgb((h + 120) % 360, s, l)),
    rgbToHex(...hslToRgb((h + 240) % 360, s, l)),
  ];
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const [copied, setCopied] = useState(false);
  const [showHarmony, setShowHarmony] = useState(false);
  const [inputMode, setInputMode] = useState<'hex' | 'rgb' | 'hsl'>('hex');
  
  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [value]);

  const handleHexInput = (hex: string) => {
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      onChange(hex.toUpperCase());
    }
  };

  const handleRgbInput = (r: number, g: number, b: number) => {
    if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
      onChange(rgbToHex(r, g, b));
    }
  };

  const handleHslInput = (h: number, s: number, l: number) => {
    if (h >= 0 && h <= 360 && s >= 0 && s <= 100 && l >= 0 && l <= 100) {
      const [r, g, b] = hslToRgb(h, s, l);
      onChange(rgbToHex(r, g, b));
    }
  };

  const [r, g, b] = hexToRgb(value);
  const [h, s, l] = rgbToHsl(r, g, b);
  const harmonyColors = showHarmony ? getHarmonyColors(value) : [];

  return (
    <div className="theme-scope space-y-4 bg-background rounded-lg border border-muted p-4">
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      
      <div className="space-y-4">
        {/* Color Preview */}
        <div className="flex items-center gap-2">
          <div
            className="h-10 w-10 rounded-lg border border-muted shadow-sm cursor-pointer"
            style={{ backgroundColor: value }}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setInputMode(mode => mode === 'hex' ? 'rgb' : mode === 'rgb' ? 'hsl' : 'hex')}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {inputMode.toUpperCase()}
              </button>
              {inputMode === 'hex' && (
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleHexInput(e.target.value)}
                  className="flex-1 bg-transparent text-sm font-mono px-2 py-1 rounded border border-muted"
                  spellCheck={false}
                />
              )}
              {inputMode === 'rgb' && (
                <div className="flex items-center gap-1 text-sm font-mono">
                  <input
                    type="number"
                    value={r}
                    onChange={(e) => handleRgbInput(parseInt(e.target.value), g, b)}
                    className="w-14 bg-transparent px-2 py-1 rounded border border-muted"
                    min="0"
                    max="255"
                  />
                  <input
                    type="number"
                    value={g}
                    onChange={(e) => handleRgbInput(r, parseInt(e.target.value), b)}
                    className="w-14 bg-transparent px-2 py-1 rounded border border-muted"
                    min="0"
                    max="255"
                  />
                  <input
                    type="number"
                    value={b}
                    onChange={(e) => handleRgbInput(r, g, parseInt(e.target.value))}
                    className="w-14 bg-transparent px-2 py-1 rounded border border-muted"
                    min="0"
                    max="255"
                  />
                </div>
              )}
              {inputMode === 'hsl' && (
                <div className="flex items-center gap-1 text-sm font-mono">
                  <input
                    type="number"
                    value={Math.round(h)}
                    onChange={(e) => handleHslInput(parseInt(e.target.value), s, l)}
                    className="w-14 bg-transparent px-2 py-1 rounded border border-muted"
                    min="0"
                    max="360"
                  />
                  <input
                    type="number"
                    value={Math.round(s)}
                    onChange={(e) => handleHslInput(h, parseInt(e.target.value), l)}
                    className="w-14 bg-transparent px-2 py-1 rounded border border-muted"
                    min="0"
                    max="100"
                  />
                  <input
                    type="number"
                    value={Math.round(l)}
                    onChange={(e) => handleHslInput(h, s, parseInt(e.target.value))}
                    className="w-14 bg-transparent px-2 py-1 rounded border border-muted"
                    min="0"
                    max="100"
                  />
                </div>
              )}
              <button
                onClick={copyToClipboard}
                className="p-1 text-muted-foreground hover:text-foreground"
                title={copied ? 'Copied!' : 'Copy color'}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
              <button
                onClick={() => setShowHarmony(show => !show)}
                className={cn(
                  "p-1 text-muted-foreground hover:text-foreground",
                  showHarmony && "text-primary"
                )}
                title="Show harmony colors"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Harmony Colors */}
        {showHarmony && (
          <div className="flex gap-2">
            {harmonyColors.map((color, i) => (
              <button
                key={i}
                onClick={() => onChange(color)}
                className="h-8 w-8 rounded-md border border-muted shadow-sm hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title="Use this color"
              />
            ))}
          </div>
        )}

        {/* HSL Sliders */}
        <div className="space-y-2">
          <div>
            <input
              type="range"
              min="0"
              max="360"
              value={h}
              onChange={(e) => handleHslInput(parseInt(e.target.value), s, l)}
              className="w-full h-6 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
              style={{
                background: `linear-gradient(to right, 
                  hsl(0, ${s}%, ${l}%),
                  hsl(60, ${s}%, ${l}%),
                  hsl(120, ${s}%, ${l}%),
                  hsl(180, ${s}%, ${l}%),
                  hsl(240, ${s}%, ${l}%),
                  hsl(300, ${s}%, ${l}%),
                  hsl(360, ${s}%, ${l}%)
                )`
              }}
            />
            <span className="text-xs text-muted-foreground">Hue</span>
          </div>
          <div>
            <input
              type="range"
              min="0"
              max="100"
              value={s}
              onChange={(e) => handleHslInput(h, parseInt(e.target.value), l)}
              className="w-full h-6 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
              style={{
                background: `linear-gradient(to right,
                  hsl(${h}, 0%, ${l}%),
                  hsl(${h}, 50%, ${l}%),
                  hsl(${h}, 100%, ${l}%)
                )`
              }}
            />
            <span className="text-xs text-muted-foreground">Saturation</span>
          </div>
          <div>
            <input
              type="range"
              min="0"
              max="100"
              value={l}
              onChange={(e) => handleHslInput(h, s, parseInt(e.target.value))}
              className="w-full h-6 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
              style={{
                background: `linear-gradient(to right,
                  hsl(${h}, ${s}%, 0%),
                  hsl(${h}, ${s}%, 50%),
                  hsl(${h}, ${s}%, 100%)
                )`
              }}
            />
            <span className="text-xs text-muted-foreground">Lightness</span>
          </div>
        </div>

        {/* Preset Colors */}
        <div className="space-y-2 border-t border-muted pt-4">
          {Object.entries(PRESET_COLORS).map(([group, colors]) => (
            <div key={group}>
              <div className="text-xs text-muted-foreground mb-1">{group}</div>
              <div className="flex flex-wrap gap-1">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => onChange(color)}
                    className="h-6 w-6 rounded border border-muted shadow-sm hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}