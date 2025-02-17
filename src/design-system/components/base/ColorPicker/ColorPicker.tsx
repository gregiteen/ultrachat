import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { ColorWheel } from './ColorWheel';
import { hexToHsl, hslToHex, getHarmonyColors, PRESET_COLORS } from './colorUtils';
import { cn } from '../../../utils';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  disabled?: boolean;
  'aria-label'?: string;
}

export function ColorPicker({ 
  value, 
  onChange, 
  label,
  disabled = false,
  'aria-label': ariaLabel 
}: ColorPickerProps) {
  const [copied, setCopied] = useState(false);
  
  // Memoize color calculations
  const [h, s, l] = useMemo(() => hexToHsl(value), [value]);
  const harmonyColors = useMemo(() => getHarmonyColors(value), [value]);

  // Cleanup timeout on unmount
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (copied) {
      timeout = setTimeout(() => setCopied(false), 2000);
    }
    return () => clearTimeout(timeout);
  }, [copied]);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [value]);

  const handleLightnessChange = useCallback((newL: number) => {
    onChange(hslToHex(h, s, newL));
  }, [h, s, onChange]);

  const handleHexInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const hex = event.target.value;
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      onChange(hex.toUpperCase());
    }
  }, [onChange]);

  // Memoize gradient background for lightness slider
  const lightnessGradient = useMemo(() => ({
    background: `linear-gradient(to right,
      hsl(${h}, ${s}%, 0%),
      hsl(${h}, ${s}%, 50%),
      hsl(${h}, ${s}%, 100%)
    )`
  }), [h, s]);

  return (
    <div 
      className={cn(
        "theme-scope space-y-2 bg-background rounded-lg border border-muted p-3",
        disabled && "opacity-50 pointer-events-none"
      )}
      role="group"
      aria-label={ariaLabel || label || "Color picker"}
      aria-disabled={disabled}
    >
      {label && (
        <label className="block text-sm font-medium text-foreground mb-1">
          {label}
        </label>
      )}

      <div className="space-y-3">
        {/* Main Color Selection */}
        <div className="flex items-start gap-4">
          {/* Color Wheel */}
          <ColorWheel 
            value={value} 
            onChange={onChange}
            disabled={disabled}
          />

          {/* Color Info and Harmony */}
          <div className="flex-1 space-y-4">
            {/* Current Color */}
            <div className="flex items-center gap-2">
              <div
                className="h-8 w-8 rounded-lg border border-muted shadow-sm"
                style={{ backgroundColor: value }}
                role="presentation"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={value.toUpperCase()}
                    onChange={handleHexInput}
                    className="flex-1 bg-transparent text-xs font-mono px-2 py-1 rounded border border-muted"
                    spellCheck={false}
                    aria-label="Hex color value"
                    disabled={disabled}
                  />
                  <button
                    onClick={copyToClipboard}
                    className="p-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    title={copied ? 'Copied!' : 'Copy color'}
                    disabled={disabled}
                    aria-label="Copy color value"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Harmony Colors */}
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Harmony Colors</div>
              <div className="flex gap-2" role="list">
                {harmonyColors.map((color, i) => (
                  <button
                    key={i}
                    onClick={() => onChange(color)}
                    className="h-6 w-6 rounded-md border border-muted shadow-sm hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-primary"
                    style={{ backgroundColor: color }}
                    title={`Use harmony color ${color}`}
                    disabled={disabled}
                    role="listitem"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Lightness Slider */}
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Lightness</div>
          <div>
            <input
              type="range"
              min="0"
              max="100"
              value={l}
              onChange={(e) => handleLightnessChange(parseInt(e.target.value))}
              className="w-full h-4 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-muted [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-muted [&::-moz-range-thumb]:cursor-pointer"
              style={lightnessGradient}
              disabled={disabled}
              aria-label="Adjust color lightness"
            />
          </div>
        </div>

        {/* Preset Colors */}
        <div className="space-y-1 border-t border-muted pt-2">
          {Object.entries(PRESET_COLORS).map(([group, colors]) => (
            <div key={group} role="group" aria-label={`${group} preset colors`}>
              <div className="text-xs text-muted-foreground mb-1">{group}</div>
              <div className="flex flex-wrap gap-1" role="list">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => onChange(color)}
                    className="h-6 w-6 rounded border border-muted shadow-sm hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-primary"
                    style={{ backgroundColor: color }}
                    title={color}
                    disabled={disabled}
                    role="listitem"
                    aria-label={`Use preset color ${color}`}
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