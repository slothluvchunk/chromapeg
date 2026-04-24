import type { ColorDef } from '../colors';
import { PALETTE } from '../colors';

interface ColorPegProps {
  colorId: string | null;
  size?: 'md' | 'sm';
  onClick?: () => void;
  selected?: boolean;
  empty?: boolean;
  label?: string;
}

export function ColorPeg({ colorId, size = 'md', onClick, selected, empty, label }: ColorPegProps) {
  const color = colorId ? PALETTE.find((c) => c.id === colorId) : null;

  const modifiers = [
    size === 'sm' ? 'color-peg--sm' : '',
    selected ? 'color-peg--selected' : '',
    empty ? 'color-peg--empty' : '',
    onClick ? 'color-peg--interactive' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const style = color
    ? { backgroundColor: color.hex, color: color.textColor }
    : {};

  const ariaLabel = label ?? (color ? color.label : 'empty slot');

  return (
    <button
      className={`color-peg ${modifiers}`}
      style={style}
      onClick={onClick}
      aria-label={ariaLabel}
      type="button"
      disabled={!onClick}
    >
      {color && <span className="color-peg__icon" aria-hidden="true">{color.icon}</span>}
    </button>
  );
}

// Palette variant — shows a color from the full ColorDef (used in ColorPalette)
interface PaletteSwatchProps {
  color: ColorDef;
  onClick: () => void;
}

export function PaletteSwatch({ color, onClick }: PaletteSwatchProps) {
  return (
    <button
      className="color-peg color-peg--interactive"
      style={{ backgroundColor: color.hex, color: color.textColor }}
      onClick={onClick}
      aria-label={`Add ${color.label}`}
      type="button"
    >
      <span className="color-peg__icon" aria-hidden="true">{color.icon}</span>
    </button>
  );
}
