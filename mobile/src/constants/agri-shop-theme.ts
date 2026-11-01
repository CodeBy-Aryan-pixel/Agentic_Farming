import type { ProductCategory } from '@/data/agriProducts';

export const ShopColors = {
  background: '#F6F9F5',
  surface: '#FFFFFF',
  primary: '#2D7A31',
  primaryDark: '#256F2B',
  primaryDeep: '#1E5B23',
  heading: '#102A13',
  body: '#4B5D4D',
  muted: '#6B7A6C',
  soft: '#8A978B',
  border: '#E6ECE6',
  softGreen: '#EAF5E8',
  mint: '#F0F7EE',
  chipBorder: '#CFE1CC',
  white: '#FFFFFF',
  amber: '#FFF7E6',
  amberBorder: '#E8CD8A',
  amberText: '#725311',
  danger: '#B3261E',
  dangerSoft: '#FDECEA',
  success: '#1D7A46',
  star: '#D99A06',
  disabled: '#A9B6A9',
} as const;

export const ShopLayout = {
  maxContentWidth: 1180,
  gutter: 20,
  gap: 16,
  radius: 16,
  radiusLarge: 24,
  cardPadding: 20,
} as const;

export const CategoryMeta: Record<
  ProductCategory,
  { emoji: string; tint: string; text: string; shortLabel: string }
> = {
  Fungicides: {
    emoji: '',
    tint: '#F0EDF9',
    text: '#5B4B8A',
    shortLabel: 'Fungicides',
  },
  Pesticides: {
    emoji: '',
    tint: '#FDF0E7',
    text: '#A15A1E',
    shortLabel: 'Pesticides',
  },
  Fertilizers: {
    emoji: '',
    tint: '#EAF6E7',
    text: '#2D7A31',
    shortLabel: 'Fertilizers',
  },
  'Bio-Cures & Organics': {
    emoji: '',
    tint: '#E8F5EF',
    text: '#1E7A55',
    shortLabel: 'Bio-Cures',
  },
  'Micronutrients & Seeds': {
    emoji: '',
    tint: '#FFF6E3',
    text: '#8A6414',
    shortLabel: 'Micronutrients',
  },
};

export function categoryEmoji(category: ProductCategory): string {
  return '';
}
