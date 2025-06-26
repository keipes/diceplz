import {
  getGlobalMinMax,
  getGlobalMinMaxScores,
  getKillTempo,
  getKillTempoForConfigurations,
  getMinMaxRanges,
  getMinMaxScores,
  getValueFn,
} from "../../../Charts/KillTempoChart";
import { SELECTOR_AUTO } from "../../../Charts/TTKChart";
import { OptimizerContext } from "./types";

export class KillinessOptimizer {
  /**
   * Analyzes and filters weapons based on killiness score in a range
   */
  static filterByKilliness(
    { configurator, modifiers }: OptimizerContext,
    minRange: number,
    maxRange: number,
    threshold: number = 0.8
  ): void {
    const selector = SELECTOR_AUTO;
    const killTempos = getKillTempoForConfigurations(
      configurator,
      modifiers,
      selector,
      maxRange
    );

    const relativeToOnlyCurrentWeapons = true;
    const rangeRelative = true;
    const values = getMinMaxRanges(
      killTempos,
      selector,
      relativeToOnlyCurrentWeapons
    );

    const globalMinMax = getGlobalMinMax(values);
    const valueFn = getValueFn(values, globalMinMax, rangeRelative);
    const scores = getMinMaxScores(
      killTempos,
      valueFn,
      selector,
      relativeToOnlyCurrentWeapons
    );

    const globalMinMaxScores = getGlobalMinMaxScores(scores);

    configurator.Filter((config) => {
      const killTempo = getKillTempo(config, modifiers, selector, maxRange);

      if (killTempo.length === 0) {
        return false;
      }

      for (let i = minRange; i <= maxRange; i++) {
        if (i > killTempo.length) {
          console.warn(
            `Range exceeds killTempo length: ${i} > ${killTempo.length}`
          );
          break;
        }

        const value = valueFn(killTempo[i]);
        let minMax = globalMinMaxScores;
        if (rangeRelative) {
          minMax = scores[i];
        }

        const scoreRange = minMax.maxScore - minMax.minScore;
        const minRequiredScore = minMax.minScore + scoreRange * threshold;

        if (value >= minRequiredScore) {
          return true;
        }
      }
      return false;
    });
  }

  /**
   * Predefined killiness range configurations
   */
  static readonly KILLINESS_RANGES = [
    [0, 9],
    [0, 19],
    [0, 29],
    [0, 39],
    [0, 49],
    [0, 74],
    [0, 99],
    [0, 149],
    [0, 150],
    [10, 19],
    [20, 29],
    [30, 39],
    [30, 49],
    [40, 49],
    [50, 74],
    [50, 150],
    [74, 99],
    [100, 124],
    [100, 150],
  ] as const;
}
