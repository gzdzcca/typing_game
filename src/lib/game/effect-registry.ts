// ---------------------------------------------------------------------------
// effect-registry.ts  --  Weighted random selection with no-repeat buffer
// ---------------------------------------------------------------------------

import type { RevealEffectType } from "@/lib/types/game";
import { createEffect, type RevealEffect } from "./reveal-effects";

interface WeightedEntry {
  type: RevealEffectType;
  weight: number;
}

const EFFECT_WEIGHTS: WeightedEntry[] = [
  { type: "blur", weight: 1.0 },
  { type: "mosaic", weight: 1.0 },
  { type: "jigsaw", weight: 1.0 },
  { type: "curtain", weight: 1.0 },
  { type: "spotlight", weight: 1.0 },
  { type: "sparkle", weight: 1.2 },
  { type: "paintbrush", weight: 1.0 },
];

const NO_REPEAT_BUFFER = 3;

export class EffectRegistry {
  private recentEffects: string[] = [];

  /**
   * Pick a weighted-random effect that has not appeared in the last 3 rounds.
   * Returns both the type enum and a freshly constructed RevealEffect instance.
   */
  selectEffect(): { type: RevealEffectType; effect: RevealEffect } {
    // Filter out recently-used effects
    const candidates = EFFECT_WEIGHTS.filter(
      (e) => !this.recentEffects.includes(e.type),
    );

    // Fallback: if everything is excluded (fewer than 4 effects total),
    // allow all effects
    const pool = candidates.length > 0 ? candidates : EFFECT_WEIGHTS;

    // Weighted random pick
    const totalWeight = pool.reduce((sum, e) => sum + e.weight, 0);
    let roll = Math.random() * totalWeight;
    let chosen = pool[0];

    for (const entry of pool) {
      roll -= entry.weight;
      if (roll <= 0) {
        chosen = entry;
        break;
      }
    }

    // Maintain no-repeat buffer
    this.recentEffects.push(chosen.type);
    if (this.recentEffects.length > NO_REPEAT_BUFFER) {
      this.recentEffects.shift();
    }

    return {
      type: chosen.type,
      effect: createEffect(chosen.type),
    };
  }
}
