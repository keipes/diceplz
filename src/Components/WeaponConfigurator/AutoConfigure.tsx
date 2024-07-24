import { Modifiers } from "../../Data/ConfigLoader";
import {
  GetAmmoStat,
  GetStatsForConfiguration,
  GetWeaponByName,
  StatMatchFilter,
  StatMatchMask,
  StatsMatch,
  Weapon,
  WeaponCategories,
  WeaponStats,
} from "../../Data/WeaponData";
import { BTK2, KillsPerMag, TTK } from "../../Util/Conversions";
import { ConfiguratorContext } from "../App";
import "./AutoConfigure.css";
import {
  MouseEventHandler,
  ReactElement,
  useContext,
  useState,
  MouseEvent,
} from "react";
import { WeaponConfiguration } from "./WeaponConfigurator";
import {
  getGlobalMinMax,
  getGlobalMinMaxScores,
  getKillTempo,
  getKillTempoForConfigurations,
  getMinMaxRanges,
  getMinMaxScores,
  getValueFn,
} from "../Charts/KillTempoChart";
import { SELECTOR_AUTO } from "../Charts/TTKChart";

interface AutoConfigureProps {
  modifiers: Modifiers;
}

function AutoConfigure(props: AutoConfigureProps) {
  const clickClass = "wcf-config-action hover-blue";
  const [ttkInputRange, setTTKInputRange] = useState(30);
  const configurator = useContext(ConfiguratorContext);
  const [requiredBTK, setRequiredBTK] = useState(4);
  const [requiredBTKRange, setRequiredBTKRange] = useState(30);
  const [requiredBTKWeaponCategory, setRequiredBTKWeaponCategory] = useState(
    WeaponCategories[0]
  );
  const [requiredBTKNumHeadshots, setRequiredBTKNumHeadshots] = useState(0);
  const [allConfigsOnlyLargestMag, setAllConfigsOnlyLargestMag] =
    useState(true);
  const [allConfigsIgnoreAP, setAllConfigsIgnoreAP] = useState(true);
  function minimizeTTK(range: number) {
    configurator.Maximize((config, stat) => {
      let damage = 0;
      for (let i = 0; i < stat.dropoffs.length; i++) {
        if (stat.dropoffs[i].range > range) {
          break;
        }
        damage = stat.dropoffs[i].damage;
      }
      return -TTK(
        config,
        props.modifiers,
        damage,
        stat.rpmAuto ? stat.rpmAuto : 0
      );
    });
  }
  function getRangeScorer(range: number): MouseEventHandler {
    return (_: MouseEvent<HTMLElement>) => {
      minimizeTTK(range);
    };
  }
  function maximizeKillsPerMag(range: number) {
    configurator.Maximize((config, stat) => {
      let statConfig: WeaponConfiguration = {
        name: config.name,
        barrelType: stat.barrelType,
        ammoType: stat.ammoType,
        visible: config.visible,
      };
      return KillsPerMag(statConfig, props.modifiers, range);
    });
  }
  function getKillsPerMagScorer(range: number): MouseEventHandler {
    return (_: MouseEvent<HTMLElement>) => {
      maximizeKillsPerMag(range);
    };
  }

  function bestTTKFinder(rpmSelector: (stat: any) => number) {
    const ttks = new Map<number, number>();
    let lowestEndTTK = Infinity;
    let highestRangeSeen = 0;
    configurator.ForEach((config) => {
      GetWeaponByName(config.name).stats.forEach((stat) => {
        for (let i = 0; i < stat.dropoffs.length; i++) {
          const ttk = TTK(
            config,
            props.modifiers,
            stat.dropoffs[i].damage,
            rpmSelector(stat)
          );
          const range = stat.dropoffs[i].range;
          if (range > highestRangeSeen) {
            highestRangeSeen = range;
          }
          if (!ttks.has(range) || ttks.get(range)! > ttk) {
            ttks.set(range, ttk);
          }
        }
        const ttk = TTK(
          config,
          props.modifiers,
          stat.dropoffs[stat.dropoffs.length - 1].damage,
          rpmSelector(stat)
        );
        if (ttk < lowestEndTTK) {
          lowestEndTTK = ttk;
        }
      });
    });
    // console.log(highestRangeSeen);
    // console.log(lowestEndTTK);
    let keys = Array.from(ttks.keys());
    keys.sort((a, b) => b - a);
    let lowestTTK = 10000;
    for (const key of keys) {
      let ttk = ttks.get(key);
      if (ttk && ttk < lowestTTK) {
        lowestTTK = ttk;
      } else if (ttk && ttk > lowestTTK) {
        ttks.set(key, lowestTTK);
      }
    }
    configurator.Select((weapon, stat) => {
      for (const dropoff of stat.dropoffs) {
        const ttk = TTK(
          {
            name: weapon.name,
            barrelType: stat.barrelType,
            ammoType: stat.ammoType,
            visible: true,
          },
          props.modifiers,
          dropoff.damage,
          rpmSelector(stat)
        );
        const pctTtk = (ttks.get(dropoff.range) || Infinity) / ttk;
        if (pctTtk > 0.9) {
          if (dropoff.range == highestRangeSeen && ttk > lowestEndTTK) {
            console.log(
              "Did not select " + name + " at " + dropoff.range + "m."
            );
            return false;
          }
          console.log("Selected " + name + " at " + dropoff.range + "m.");
          return true;
        }
      }
      return false;
    });
  }

  function getKillinessScorer(
    minRange: number,
    maxRange: number
  ): MouseEventHandler {
    return (_: MouseEvent<HTMLElement>) => {
      doKilliness(minRange, maxRange);
    };
  }
  function doKilliness(minRange: number, maxRange: number): void {
    const selector = SELECTOR_AUTO;
    const killTempos = getKillTempoForConfigurations(
      configurator,
      props.modifiers,
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
    const threshold = 0.8;
    configurator.Filter((config) => {
      const killTempo = getKillTempo(
        config,
        props.modifiers,
        selector,
        maxRange
      );
      if (killTempo.length === 0) {
        return false;
      }
      for (let i = minRange; i <= maxRange; i++) {
        if (i > killTempo.length) {
          console.warn(
            "Range exceeds killTempo length." + i + " > " + killTempo.length
          );
          break;
        }
        // killTempo.length
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

  const killiness_ranges = [
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
  ];
  const killinessOptions = [];
  for (const [start, end] of killiness_ranges) {
    killinessOptions.push(
      <span className={clickClass} onClick={getKillinessScorer(start, end)}>
        {" "}
        {start}-{end}m{""}
      </span>
    );
  }
  return (
    <>
      <Configurer>
        <>
          Select Killiest
          {killinessOptions}
        </>
      </Configurer>
      <Configurer>
        <>
          {"Minimize TTK at "}
          <span className={clickClass} onClick={getRangeScorer(0)}>
            <>(0m)</>
          </span>
          {", "}
          <span className={clickClass} onClick={getRangeScorer(10)}>
            <>(10m)</>
          </span>
          {", "}
          <span className={clickClass} onClick={getRangeScorer(20)}>
            <>(20m)</>
          </span>
          {", "}
          <span className={clickClass} onClick={getRangeScorer(30)}>
            <>(30m)</>
          </span>
          {", "}
          <span className={clickClass} onClick={getRangeScorer(40)}>
            <>(40m)</>
          </span>
          {", "}
          <span className={clickClass} onClick={getRangeScorer(50)}>
            <>(50m)</>
          </span>
          {", "}
          <span className={clickClass} onClick={getRangeScorer(40)}>
            <>(75m)</>
          </span>
          {", "}
          <span className={clickClass} onClick={getRangeScorer(50)}>
            <>(100m)</>
          </span>
          {" or "}
          <span className={clickClass} onClick={getRangeScorer(150)}>
            <>(150m)</>
          </span>
          {" range."}
        </>
      </Configurer>
      <Configurer>
        <>
          {"Maximize Kills Per Mag at "}
          <span className={clickClass} onClick={getKillsPerMagScorer(0)}>
            <>(0m)</>
          </span>
          {", "}
          <span className={clickClass} onClick={getKillsPerMagScorer(10)}>
            <>(10m)</>
          </span>
          {", "}
          <span className={clickClass} onClick={getKillsPerMagScorer(20)}>
            <>(20m)</>
          </span>
          {", "}
          <span className={clickClass} onClick={getKillsPerMagScorer(30)}>
            <>(30m)</>
          </span>
          {", "}
          <span className={clickClass} onClick={getKillsPerMagScorer(40)}>
            <>(40m)</>
          </span>
          {", "}
          <span className={clickClass} onClick={getKillsPerMagScorer(50)}>
            <>(50m)</>
          </span>
          {", "}
          <span className={clickClass} onClick={getKillsPerMagScorer(40)}>
            <>(75m)</>
          </span>
          {", "}
          <span className={clickClass} onClick={getKillsPerMagScorer(50)}>
            <>(100m)</>
          </span>
          {" or "}
          <span className={clickClass} onClick={getKillsPerMagScorer(150)}>
            <>(150m)</>
          </span>
          {" range."}
        </>
      </Configurer>
      <Configurer>
        <>
          <span className={clickClass} onClick={getRangeScorer(ttkInputRange)}>
            {"Minimize TTK at "}
          </span>
          <input
            type="number"
            value={ttkInputRange}
            onChange={(e) => {
              setTTKInputRange(parseFloat(e.target.value));
              minimizeTTK(ttkInputRange);
            }}
            min={0}
            max={150}
            step={1}
          ></input>
          {" meters."}
        </>
      </Configurer>
      <Configurer>
        <>
          <span
            className={clickClass}
            onClick={(_: MouseEvent<HTMLElement>) => {
              configurator.Select((_, stat) => {
                if (stat.ammoType == "Subsonic") {
                  if (
                    {
                      "6KU": true,
                      "Type 4": true,
                      PB: true,
                      GAR45: true,
                      Factory: true,
                    }[stat.barrelType]
                  ) {
                    return true;
                  }
                }
                return false;
              });
            }}
          >
            {
              "Stealthify (select all suppressed+subsonic configurations for selected weapons, remove weapon if no stealth option exists)."
            }
          </span>
        </>
      </Configurer>
      <Configurer>
        <>
          <span
            className={clickClass}
            onClick={(_: MouseEvent<HTMLElement>) => {
              interface SeenStats {
                weapon: Weapon;
                stats: WeaponStats;
              }
              if (allConfigsOnlyLargestMag) {
                const ammoDedupeStrFn = (ammoType: string) =>
                  ammoType
                    .replace(" Extended", "")
                    .replace(" Beltfed", "")
                    .replace(" Drum", "");
                const weaponMap = new Map<string, Map<String, SeenStats[]>>();
                const ignoreMask = StatMatchMask.FromFilters(
                  StatMatchFilter.AmmoType,
                  StatMatchFilter.MagSize,
                  StatMatchFilter.TacticalReload,
                  StatMatchFilter.EmptyReload
                );
                configurator.ForEach((config) => {
                  const weapon = GetWeaponByName(config.name);
                  let seenAmmoTypes = weaponMap.get(weapon.name);
                  if (!seenAmmoTypes) {
                    seenAmmoTypes = new Map<string, SeenStats[]>();
                    weaponMap.set(weapon.name, seenAmmoTypes);
                  }
                  for (const stat of weapon.stats) {
                    const ammoDedupeStr = ammoDedupeStrFn(stat.ammoType);

                    let seenStats = seenAmmoTypes.get(ammoDedupeStr);
                    if (!seenStats) {
                      seenStats = [];
                      seenAmmoTypes.set(ammoDedupeStr, seenStats);
                    }
                    let includeStat = true;

                    const newStats = seenStats.filter((seenStat) => {
                      if (
                        StatsMatch(
                          seenStat.weapon,
                          seenStat.stats,
                          weapon,
                          stat,
                          ignoreMask
                        )
                      ) {
                        const seenAmmoStat = GetAmmoStat(
                          seenStat.weapon,
                          seenStat.stats
                        );
                        const ammoStat = GetAmmoStat(weapon, stat);
                        if (seenAmmoStat && ammoStat) {
                          if (seenAmmoStat.magSize < ammoStat.magSize) {
                            console.debug(
                              "Removing previously seen stat with lower mag size. " +
                                seenStat.weapon.name +
                                " " +
                                seenStat.stats.ammoType
                            );
                            return false;
                          }
                        }
                        console.debug(
                          "Ignoring duplicate stat. " +
                            weapon.name +
                            " " +
                            stat.ammoType
                        );
                        includeStat = false;
                      }
                      return true;
                    });
                    if (includeStat) {
                      newStats.push({ weapon, stats: stat });
                    }
                    seenAmmoTypes.set(ammoDedupeStr, newStats);
                  }
                });
                configurator.Select((weapon, stat) => {
                  if (
                    allConfigsIgnoreAP &&
                    stat.ammoType.indexOf("Armor Piercing") >= 0 &&
                    weapon.name !== "NTW-50"
                  ) {
                    return false;
                  }
                  let seenAmmoTypes = weaponMap.get(weapon.name);
                  if (seenAmmoTypes) {
                    let ammoDedupeStr = ammoDedupeStrFn(stat.ammoType);
                    let seenStats = seenAmmoTypes.get(ammoDedupeStr);
                    if (seenStats) {
                      for (const seenStat of seenStats) {
                        if (
                          stat.ammoType == seenStat.stats.ammoType &&
                          stat.barrelType == seenStat.stats.barrelType
                        ) {
                          return true;
                        }
                      }
                    }
                  }
                  return false;
                });
              } else {
                configurator.Select((_w, _s) => {
                  return true;
                });
              }
            }}
          >
            {"Add all configurations for currently selected weapons. "}
          </span>

          <label style={{ userSelect: "none" }}>
            <input
              type="checkbox"
              checked={allConfigsOnlyLargestMag}
              onChange={(e) => {
                setAllConfigsOnlyLargestMag(e.target.checked);
              }}
            />
            {"Ignore Smaller Mags For Same Ammo Type"}
          </label>
          <label style={{ userSelect: "none" }}>
            <input
              type="checkbox"
              checked={allConfigsIgnoreAP}
              onChange={(e) => {
                setAllConfigsIgnoreAP(e.target.checked);
              }}
            />
            {"Ignore AP"}
          </label>
        </>
      </Configurer>
      <Configurer>
        <>
          <span
            className={clickClass}
            onClick={(_: MouseEvent<HTMLElement>) => {
              configurator.Select((_, stat) => {
                if (stat.velocity && stat.velocity > 1000) {
                  return true;
                }
                return false;
              });
            }}
          >
            {"Add all velocity > 1000ms configurations."}
          </span>
        </>
      </Configurer>
      <Configurer>
        <>
          <span
            className={clickClass}
            onClick={(_: MouseEvent<HTMLElement>) => {
              bestTTKFinder((stat) => (stat.rpmAuto ? stat.rpmAuto : 0));
            }}
          >
            {
              "Select configurations which are within 90% of the best ttk of all weapons at some range. (Automatic Fire)"
            }
          </span>
        </>
      </Configurer>
      <Configurer>
        <>
          <span
            className={clickClass}
            onClick={(_: MouseEvent<HTMLElement>) => {
              bestTTKFinder((stat) => (stat.rpmSingle ? stat.rpmSingle : 0));
            }}
          >
            {
              "Select configurations which are within 90% of the best ttk of all weapons at some range. (Single Fire)"
            }
          </span>
        </>
      </Configurer>
      <Configurer>
        <>
          <span
            className={clickClass}
            onClick={(_: MouseEvent<HTMLElement>) => {
              configurator.Filter((config) => /ubsonic/.test(config.ammoType));
            }}
          >
            {"Select subsonic ammo from current configurations."}
          </span>
        </>
      </Configurer>
      <Configurer>
        <>
          {"Maxmize RPM "}
          <span
            className={clickClass}
            onClick={(_: MouseEvent<HTMLElement>) => {
              configurator.Maximize((_, stat) => {
                return stat.rpmAuto ? stat.rpmAuto : 0;
              });
            }}
          >
            {"(Auto)"}
          </span>
          {", "}
          <span
            className={clickClass}
            onClick={(_: MouseEvent<HTMLElement>) => {
              configurator.Maximize((_, stat) => {
                return stat.rpmBurst ? stat.rpmBurst : 0;
              });
            }}
          >
            {"(Burst)"}
          </span>
          {", "}
          <span
            className={clickClass}
            onClick={(_: MouseEvent<HTMLElement>) => {
              configurator.Maximize((_, stat) => {
                return stat.rpmSingle ? stat.rpmSingle : 0;
              });
            }}
          >
            {"(Single)"}
          </span>
        </>
      </Configurer>
      <Configurer>
        <>
          <span
            className={clickClass}
            onClick={(_: MouseEvent<HTMLElement>) => {
              configurator.Maximize((_, stat) => {
                return stat.velocity ? stat.velocity : 0;
              });
            }}
          >
            {"Maximize Velocity"}
          </span>
        </>
      </Configurer>
      <Configurer>
        <>
          <span
            className={clickClass}
            onClick={(_: MouseEvent<HTMLElement>) => {
              configurator.Maximize((config, stat) => {
                const weapon = GetWeaponByName(config.name);
                if (weapon.ammoStats) {
                  const data = weapon.ammoStats[stat.ammoType];
                  return data && data.magSize ? data.magSize : 0;
                }
                return 0;
                // return stat.velocity ? stat.velocity : 0;
              });
            }}
          >
            {"Maximize Magazine Capacity"}
          </span>
        </>
      </Configurer>
      <Configurer>
        <>
          <span
            className={clickClass}
            onClick={(_: MouseEvent<HTMLElement>) => {
              configurator.Filter((config) => {
                const weapon = GetWeaponByName(config.name);
                const stat = GetStatsForConfiguration(config);
                if (weapon.ammoStats && weapon.ammoStats[stat.ammoType]) {
                  const data = weapon.ammoStats[stat.ammoType];
                  if (data && data.magSize && data.magSize >= 30) {
                    return true;
                  }
                }
                return false;
              });
            }}
          >
            {"Filter Mag Capacity >= 30"}
          </span>
        </>
      </Configurer>
      <Configurer>
        <>
          <span
            className={clickClass}
            onClick={(_: MouseEvent<HTMLElement>) => {
              configurator.SelectFromAllWeaponsInCategory(
                requiredBTKWeaponCategory,
                (weapon, stat) => {
                  let damageAtRequiredRange = 0;
                  for (const dropoff of stat.dropoffs) {
                    if (dropoff.range <= requiredBTKRange) {
                      damageAtRequiredRange = dropoff.damage;
                    } else {
                      break;
                    }
                  }
                  const ammoStats = GetAmmoStat(weapon, stat);
                  if (!ammoStats) {
                    console.warn(
                      "No ammo stats for " + name + " " + stat.ammoType
                    );
                    return false;
                  }
                  const btk = BTK2(
                    props.modifiers,
                    damageAtRequiredRange,
                    requiredBTKNumHeadshots,
                    ammoStats
                  );
                  return btk <= requiredBTK;
                }
              );
            }}
          >
            {"Select all weapons with BTK <= "}
          </span>
          <input
            type="number"
            value={requiredBTK}
            onChange={(e) => {
              setRequiredBTK(parseFloat(e.target.value));
            }}
            min={1}
            max={10}
            step={1}
          />
          {" at "}
          <input
            type="number"
            value={requiredBTKRange}
            onChange={(e) => {
              setRequiredBTKRange(parseFloat(e.target.value));
            }}
            min={0}
            max={150}
            step={1}
          />
          {"m in "}
          <select
            value={requiredBTKWeaponCategory}
            onChange={(e) => {
              setRequiredBTKWeaponCategory(e.target.value);
            }}
          >
            {WeaponCategories.map((category) => (
              <option value={category}>{category}</option>
            ))}
          </select>
          {" with "}
          <input
            type="number"
            value={requiredBTKNumHeadshots}
            onChange={(e) => {
              setRequiredBTKNumHeadshots(parseFloat(e.target.value));
            }}
            min={0}
            // max={1}
            step={1}
          />
          {" headshots."}
        </>
      </Configurer>
    </>
  );
}

interface ConfigurerProps {
  children: ReactElement;
}

function Configurer(props: ConfigurerProps) {
  return (
    <>
      <div>{props.children}</div>
    </>
  );
}

export default AutoConfigure;
