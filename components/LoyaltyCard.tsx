'use client';

import { TIERS } from '@/lib/loyalty';

interface Props {
  tier: string;
  name: string;
  totalSpend: number;
  nextTier: string | null;
  nextMin: number | null;
  orderCount?: number;
  totalProductsPurchased?: number;
  averageSpend?: number;
}

export default function LoyaltyCard({ tier, name, totalSpend, nextTier, nextMin, orderCount, totalProductsPurchased, averageSpend }: Props) {
  const tierData = TIERS.find(t => t.name === tier) ?? TIERS[0];
  const progress = nextMin ? Math.min((totalSpend / nextMin) * 100, 100) : 100;

  const progressBarColors: Record<string, string> = {
    'Opal': 'bg-gray-400',
    'Pink Quartz': 'bg-pink-500',
    'Emerald': 'bg-emerald-500',
    'Ruby': 'bg-red-500',
    'Sapphire': 'bg-purple-500',
  };
  const barColor = progressBarColors[tier] ?? 'bg-amber-500';

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Card */}
      <div
        className={`relative bg-gradient-to-br ${tierData.gradient} rounded-2xl overflow-hidden shadow-2xl`}
        style={{ aspectRatio: '1.586 / 1', boxShadow: `0 20px 60px ${tierData.glowColor}` }}
      >
        {/* Flower glow */}
        <div
          className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full opacity-20"
          style={{ background: tierData.glowColor, filter: 'blur(20px)' }}
        />
        {/* Top-right logo mark */}
          <div className="absolute top-3 right-3 w-10 h-10 rounded-full border border-white/15 flex items-center justify-center overflow-hidden bg-black/20 z-30">
          <img
            src="/logo.jpeg"
            alt="Seloria logo"
            className="w-full h-full object-cover"
          />
        </div> 

        {/* Main content */}
        <div className="relative z-10 p-5 h-full flex flex-col justify-between">
          {/* Top */}
          <div>
            <p className={`text-xl font-bold tracking-[0.3em] uppercase ${tierData.textColor}`}>SELORIA</p>
            <p className={`text-[10px] tracking-widest mt-0.5 opacity-60 ${tierData.textColor}`}>Make It Count</p>
          </div>

          {/* Bottom */}
          <div>
            <p className={`text-[10px] tracking-widest uppercase opacity-60 mb-1 ${tierData.textColor}`}>Member</p>
            <p className={`text-lg font-semibold ${tierData.textColor}`}>{name}</p>
            <p className={`text-xl font-bold tracking-[0.2em] mt-1 ${tierData.textColor} opacity-80`}>LOYALTY CARD</p>
          </div>
        </div>

        {/* Right side bar */}
        <div className={`absolute right-0 top-0 bottom-0 w-10 ${tierData.sideColor} border-l border-white/10 flex items-center justify-center`}>
          <p
            className={`text-[11px] font-semibold tracking-wider ${tierData.textColor} whitespace-nowrap`}
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            {tier} Card
          </p>
        </div>
      </div>

      {/* Info below card */}
      <div className="mt-5 space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Total Spend</span>
          <span className="font-semibold text-gray-800">₹{totalSpend.toLocaleString('en-IN')}</span>
        </div>
        {orderCount !== undefined && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Orders</span>
            <span className="font-semibold text-gray-800">{orderCount}</span>
          </div>
        )}

        {totalProductsPurchased !== undefined && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Products</span>
            <span className="font-semibold text-gray-800">{totalProductsPurchased}</span>
          </div>
        )}

        {averageSpend !== undefined && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Avg / Product</span>
            <span className="font-semibold text-gray-800">₹{averageSpend.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
        )}

        {nextTier ? (
          <>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Next: <span className="font-medium text-gray-700">{nextTier}</span></span>
              <span className="text-gray-500">₹{nextMin?.toLocaleString('en-IN')} needed</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${barColor} rounded-full transition-all duration-700`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 text-right">
              ₹{Math.max(0, (nextMin ?? 0) - totalSpend).toLocaleString('en-IN')} more to reach {nextTier}
            </p>
          </>
        ) : (
          <div className="text-center py-2 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-amber-700 font-semibold text-sm">You've reached the highest tier!</p>
          </div>
        )}
      </div>
    </div>
  );
}
