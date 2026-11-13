import React, { useState } from 'react';
import { UserProfile, StorePerk, UserInventoryItem } from '../../types';
import { IMAGES_2D, handleImageError, PUBLIC_IMAGES } from '../../assets/images';
import { INITIAL_STORE_PERKS } from '../../data/mockData';
import { playSuccessChime, playWarningBuzzer } from '../../utils/audio';
import { triggerGrandCelebration, triggerQuickSparkle } from '../../utils/confetti';
import {
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  Zap,
  ClockAlert,
  Award,
  CheckCircle,
  PackageCheck,
  Coins,
  ChevronRight,
  Flame
} from 'lucide-react';

interface GemStoreProps {
  currentUser: UserProfile;
  onUpdateUserGems: (userId: string, gemDelta: number) => void;
  onAddUserBadge: (userId: string, badgeName: string) => void;
  onActivateStreakFreeze: (userId: string) => void;
}

export const GemRewardsStore: React.FC<GemStoreProps> = ({
  currentUser,
  onUpdateUserGems,
  onAddUserBadge,
  onActivateStreakFreeze
}) => {
  const [storePerks] = useState<StorePerk[]>(INITIAL_STORE_PERKS);
  const [purchasedInventory, setPurchasedInventory] = useState<UserInventoryItem[]>([
    {
      id: 'inv-1',
      perkId: 'perk-freeze',
      title: 'Streak Freeze Shield (Equipped)',
      purchasedAt: '3 days ago',
      isUsed: false,
      iconName: 'ShieldCheck'
    }
  ]);
  const [purchaseSuccessMessage, setPurchaseSuccessMessage] = useState<string | null>(null);

  const getPerkIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldCheck':
        return ShieldCheck;
      case 'Zap':
        return Zap;
      case 'ClockAlert':
        return ClockAlert;
      case 'Award':
        return Award;
      default:
        return Sparkles;
    }
  };

  const handlePurchase = (perk: StorePerk) => {
    if (currentUser.gems < perk.gemCost) {
      playWarningBuzzer();
      setPurchaseSuccessMessage(`Insufficient Gems! You need ${perk.gemCost - currentUser.gems} more gems. Complete quizzes or attend lectures to earn more.`);
      return;
    }

    // Deduct gems
    onUpdateUserGems(currentUser.id, -perk.gemCost);
    playSuccessChime();
    triggerGrandCelebration(2500);

    // Apply perk effect
    if (perk.id === 'perk-freeze') {
      onActivateStreakFreeze(currentUser.id);
    } else if (perk.id === 'perk-badge-algo') {
      onAddUserBadge(currentUser.id, 'Algorithm Ace');
    } else if (perk.id === 'perk-badge-titan') {
      onAddUserBadge(currentUser.id, 'Binary Titan');
    }

    const newInventoryItem: UserInventoryItem = {
      id: `inv-${Date.now()}`,
      perkId: perk.id,
      title: perk.title,
      purchasedAt: 'Just now',
      isUsed: false,
      iconName: perk.iconName
    };

    setPurchasedInventory((prev) => [newInventoryItem, ...prev]);
    setPurchaseSuccessMessage(`Successfully redeemed "${perk.title}" for ${perk.gemCost} Gems! Perk activated.`);
  };

  return (
    <div className="space-y-6">
      {/* Store Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-amber-600/20 text-amber-400">
              <ShoppingBag className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Gem Rewards & Academic Perks Store
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Redeem hard-earned study gems for academic benefits, streak protection shields, priority lab feedback, and profile badges.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* 2D Vector Trophy & Prismatic Gems Asset */}
          <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-amber-500/50 shadow-lg shadow-amber-600/30 bg-slate-950 shrink-0 transform hover:scale-105 transition" title="Championship Trophy & Gems Vector Vault">
            <img
              src={IMAGES_2D.trophyGems}
              alt="Championship Trophy 2D Vector"
              className="w-full h-full object-cover"
              onError={(e) => handleImageError(e, PUBLIC_IMAGES.trophyGems)}
            />
          </div>

          {/* Live Gem Wallet Box */}
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-300">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-amber-400/80 block">
                Your Gem Balance
              </span>
              <div className="text-2xl font-black font-mono text-amber-300 flex items-center gap-1.5">
                <span>{currentUser.gems}</span>
                <span className="text-xs font-semibold text-amber-400 uppercase">Gems</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification banner */}
      {purchaseSuccessMessage && (
        <div className="p-4 rounded-xl bg-indigo-950/80 border border-indigo-700/60 text-indigo-200 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{purchaseSuccessMessage}</span>
          </div>
          <button
            onClick={() => setPurchaseSuccessMessage(null)}
            className="text-slate-400 hover:text-white font-mono text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Perks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {storePerks.map((perk) => {
          const Icon = getPerkIcon(perk.iconName);
          const canAfford = currentUser.gems >= perk.gemCost;

          return (
            <div
              key={perk.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between transition hover:border-slate-700 hover:shadow-2xl"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400">
                    <Icon className="w-5 h-5" />
                  </div>

                  <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/80 border border-amber-700/60 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> {perk.gemCost} Gems
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mb-1">{perk.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {perk.description}
                </p>

                <div className="text-[11px] font-mono text-emerald-400 bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center gap-1.5 mb-4">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Benefit: {perk.perkEffect}</span>
                </div>
              </div>

              <button
                onClick={() => handlePurchase(perk)}
                disabled={!canAfford}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  canAfford
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                {canAfford ? (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Redeem Perk ({perk.gemCost} Gems)</span>
                  </>
                ) : (
                  <span>Need {perk.gemCost - currentUser.gems} More Gems</span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* User Inventory & Active Badges Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white text-sm">
              Your Purchased Perks & Active Academic Badges
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Student: {currentUser.name}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Active Badges */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400 block mb-2 font-bold">
              Showcased Profile Badges
            </span>
            <div className="flex flex-wrap gap-2">
              {currentUser.activeBadges.map((badge, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-950/60 to-indigo-950/60 border border-amber-600/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Active Perks Inventory */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400 block mb-2 font-bold">
              Equipped Inventory
            </span>
            <div className="space-y-2">
              {purchasedInventory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-xs text-slate-300 bg-slate-900 p-2 rounded-lg border border-slate-800"
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    {item.title}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {item.purchasedAt}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
