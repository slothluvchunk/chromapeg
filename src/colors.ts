export interface ColorDef {
  id: string;
  hex: string;
  label: string;
  icon: string;
  textColor: string;
}

// Chosen for maximum perceptual distance across protanopia, deuteranopia,
// and tritanopia. Adjacent entries are as dissimilar as possible.
// Icons ensure color is never the sole differentiator.
export const PALETTE: ColorDef[] = [
  { id: 'blue',   hex: '#0072B2', label: 'Blue',   icon: '◆', textColor: '#ffffff' },
  { id: 'orange', hex: '#E69F00', label: 'Orange', icon: '★', textColor: '#1a1a1a' },
  { id: 'green',  hex: '#009E73', label: 'Green',  icon: '●', textColor: '#ffffff' },
  { id: 'pink',   hex: '#CC79A7', label: 'Pink',   icon: '♥', textColor: '#ffffff' },
  { id: 'sky',    hex: '#56B4E9', label: 'Sky',    icon: '▲', textColor: '#1a1a1a' },
  { id: 'red',    hex: '#D55E00', label: 'Red',    icon: '■', textColor: '#ffffff' },
  { id: 'yellow', hex: '#F0E442', label: 'Yellow', icon: '♦', textColor: '#1a1a1a' },
  { id: 'purple', hex: '#7B2D8B', label: 'Purple', icon: '✦', textColor: '#ffffff' },
];

export function generateSecret(
  pool: ColorDef[],
  length: number,
  allowDuplicates: boolean,
): string[] {
  const ids = pool.map((c) => c.id);
  const result: string[] = [];

  if (!allowDuplicates && length > ids.length) {
    throw new Error('Cannot generate secret: length exceeds pool size without duplicates');
  }

  const available = [...ids];
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * available.length);
    result.push(available[idx]);
    if (!allowDuplicates) {
      available.splice(idx, 1);
    }
  }
  return result;
}
