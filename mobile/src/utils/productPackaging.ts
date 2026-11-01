export const PACKAGING_TYPES = [
  'bottle-amber',
  'bottle-white',
  'Bottle-nano',
  'pouch-foil',
  'sack-50kg',
  'seed-packet',
] as const;

export type PackagingType = (typeof PACKAGING_TYPES)[number];

export const TOXICITY_CLASSES = ['green', 'blue', 'yellow', 'red'] as const;

export type ToxicityClass = (typeof TOXICITY_CLASSES)[number];
