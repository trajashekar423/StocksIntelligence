/**
 * Sector Strength & Industry Tailwinds Engine
 *
 * Tracks major Indian sectoral indices and computes:
 * Sector Score = Sector Return + Relative Volume + Breadth + Relative Strength vs NIFTY
 *
 * Provides sector-strength adjustments:
 * - Strong sector + strong stock = +5 to +10 score boost
 * - Weak sector + weak stock = +10 short score boost
 * - Conflicting sector (e.g. buying IT when Nifty IT is crashing) = penalty
 */

export interface SectorMetric {
  name: string;
  changePct: number;
  relativeVolume: number;
  advances: number;
  declines: number;
  rsVsNifty: number; // e.g. Sector Change - Nifty Change
  sectorScore: number; // 0 - 100
  bias: 'LEADER' | 'OUTPERFORMING' | 'NEUTRAL' | 'LAGGING' | 'WEAK';
}

export interface SectorStrengthResult {
  sectors: Record<string, SectorMetric>;
  rankedLeaders: SectorMetric[];
  rankedLaggards: SectorMetric[];
  topSectorName: string;
  weakestSectorName: string;
  getSectorAdjustment: (sectorName: string, isLongCandidate: boolean) => {
    adjustmentScore: number;
    reason: string;
    isTailwind: boolean;
  };
}

const DEFAULT_SECTORS: Record<string, { changePct: number; rvol: number; advances: number; declines: number }> = {
  IT: { changePct: 1.25, rvol: 1.4, advances: 8, declines: 2 },
  BANKING: { changePct: 0.65, rvol: 1.2, advances: 9, declines: 3 },
  AUTO: { changePct: 0.95, rvol: 1.3, advances: 11, declines: 4 },
  PHARMA: { changePct: 0.40, rvol: 1.0, advances: 12, declines: 8 },
  METALS: { changePct: -0.55, rvol: 1.1, advances: 4, declines: 11 },
  ENERGY: { changePct: 0.20, rvol: 0.9, advances: 5, declines: 5 },
  FMCG: { changePct: 0.15, rvol: 0.85, advances: 8, declines: 7 },
  REALTY: { changePct: 1.80, rvol: 1.6, advances: 8, declines: 2 },
  FINANCIAL_SERVICES: { changePct: 0.50, rvol: 1.15, advances: 13, declines: 7 },
};

export function computeSectorStrength(
  liveSectorInputs: Record<string, Partial<SectorMetric>> = {},
  niftyChangePct: number = 0.35
): SectorStrengthResult {
  const sectors: Record<string, SectorMetric> = {};

  const sectorNames = Object.keys(DEFAULT_SECTORS);

  sectorNames.forEach((name) => {
    const fallback = DEFAULT_SECTORS[name];
    const live = liveSectorInputs[name] || {};

    const changePct = live.changePct ?? fallback.changePct;
    const rvol = live.relativeVolume ?? fallback.rvol;
    const advances = live.advances ?? fallback.advances;
    const declines = live.declines ?? fallback.declines;

    // Relative Strength vs NIFTY
    const rsVsNifty = Number((changePct - niftyChangePct).toFixed(2));

    // Calculate Sector Score (0 - 100)
    // 1. Return Component (0 - 40 pts)
    const returnScore = Math.max(Math.min(((changePct + 2.0) / 4.0) * 40, 40), 0);

    // 2. Relative Volume Component (0 - 25 pts)
    const rvolScore = Math.max(Math.min((rvol / 2.0) * 25, 25), 5);

    // 3. Breadth Component (0 - 20 pts)
    const totalBreadth = advances + declines;
    const breadthScore = totalBreadth > 0 ? (advances / totalBreadth) * 20 : 10;

    // 4. RS vs Nifty Component (0 - 15 pts)
    const rsScore = Math.max(Math.min(((rsVsNifty + 1.5) / 3.0) * 15, 15), 0);

    const rawTotal = returnScore + rvolScore + breadthScore + rsScore;
    const sectorScore = Math.max(Math.min(Math.round(rawTotal), 100), 0);

    let bias: SectorMetric['bias'] = 'NEUTRAL';
    if (sectorScore >= 80) bias = 'LEADER';
    else if (sectorScore >= 65) bias = 'OUTPERFORMING';
    else if (sectorScore >= 45) bias = 'NEUTRAL';
    else if (sectorScore >= 30) bias = 'LAGGING';
    else bias = 'WEAK';

    sectors[name] = {
      name,
      changePct,
      relativeVolume: rvol,
      advances,
      declines,
      rsVsNifty,
      sectorScore,
      bias,
    };
  });

  const list = Object.values(sectors);
  const rankedLeaders = [...list].sort((a, b) => b.sectorScore - a.sectorScore);
  const rankedLaggards = [...list].sort((a, b) => a.sectorScore - b.sectorScore);

  const topSectorName = rankedLeaders[0]?.name || 'AUTO';
  const weakestSectorName = rankedLaggards[0]?.name || 'METALS';

  const getSectorAdjustment = (sectorName: string, isLongCandidate: boolean) => {
    const upper = String(sectorName || '').toUpperCase().trim();
    // Match partial names, e.g. "Auto & Auto Components" -> "AUTO"
    const matchedKey = Object.keys(sectors).find((k) => upper.includes(k) || k.includes(upper));
    const sec = matchedKey ? sectors[matchedKey] : null;

    if (!sec) {
      return { adjustmentScore: 0, reason: 'Sector neutral / unclassified', isTailwind: true };
    }

    if (isLongCandidate) {
      if (sec.bias === 'LEADER') {
        return { adjustmentScore: 8, reason: `Leading Sector (+${sec.changePct}%) gives institutional tailwind`, isTailwind: true };
      }
      if (sec.bias === 'OUTPERFORMING') {
        return { adjustmentScore: 5, reason: `Sector outperforming Nifty (+${sec.rsVsNifty}% RS)`, isTailwind: true };
      }
      if (sec.bias === 'WEAK' || sec.bias === 'LAGGING') {
        return { adjustmentScore: -8, reason: `Sector dragging down (${sec.changePct}%), headwind risk`, isTailwind: false };
      }
      return { adjustmentScore: 0, reason: 'Sector tracking in-line with broader market', isTailwind: true };
    } else {
      // Short candidate
      if (sec.bias === 'WEAK' || sec.bias === 'LAGGING') {
        return { adjustmentScore: 8, reason: `Sector dragging heavily (${sec.changePct}%), boosts short momentum`, isTailwind: true };
      }
      if (sec.bias === 'LEADER') {
        return { adjustmentScore: -10, reason: 'High risk: Sector is leading market upward, avoid shorting', isTailwind: false };
      }
      return { adjustmentScore: 0, reason: 'Sector neutral for shorting', isTailwind: true };
    }
  };

  return {
    sectors,
    rankedLeaders,
    rankedLaggards,
    topSectorName,
    weakestSectorName,
    getSectorAdjustment,
  };
}

