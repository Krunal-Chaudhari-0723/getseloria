export interface Tier {
  name: string;
  min: number;
  gradient: string;
  sideColor: string;
  textColor: string;
  glowColor: string;
  badge: string;
}

export const TIERS: Tier[] = [
  {
    name: 'Opal',
    min: 0,
    gradient: 'from-gray-900 via-gray-600 to-gray-800',
    sideColor: 'bg-gray-700',
    textColor: 'text-gray-200',
    glowColor: 'rgba(156,163,175,0.3)',
    badge: 'bg-gray-200 text-gray-800',
  },
  {
    name: 'Pink Quartz',
    min: 20,
    gradient: 'from-black via-fuchsia-900 to-pink-800',
    sideColor: 'bg-pink-950',
    textColor: 'text-pink-200',
    glowColor: 'rgba(217,70,239,0.3)',
    badge: 'bg-pink-100 text-pink-800',
  },
  {
    name: 'Emerald',
    min: 30,
    gradient: 'from-black via-green-900 to-emerald-800',
    sideColor: 'bg-green-950',
    textColor: 'text-emerald-200',
    glowColor: 'rgba(16,185,129,0.3)',
    badge: 'bg-emerald-100 text-emerald-800',
  },
  {
    name: 'Ruby',
    min: 50,
    gradient: 'from-black via-red-900 to-red-800',
    sideColor: 'bg-red-950',
    textColor: 'text-red-200',
    glowColor: 'rgba(239,68,68,0.3)',
    badge: 'bg-red-100 text-red-800',
  },
  {
    name: 'Sapphire',
    min: 60,
    gradient: 'from-black via-purple-900 to-blue-900',
    sideColor: 'bg-indigo-950',
    textColor: 'text-purple-200',
    glowColor: 'rgba(139,92,246,0.3)',
    badge: 'bg-purple-100 text-purple-800',
  },
];

export function getTier(totalSpend: number): Tier {
  let tier: Tier = TIERS[0];
  for (const t of TIERS) {
    if (totalSpend >= t.min) tier = t;
  }
  return tier;
}

export function getNextTier(totalSpend: number): Tier | null {
  for (const t of TIERS) {
    if (totalSpend < t.min) return t;
  }
  return null;
}
