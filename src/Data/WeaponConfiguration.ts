import {
  GetCategoryWeapons,
  GetWeaponByName,
  Weapon,
  WeaponStats,
  WeaponCategories,
  AmmoStat,
  GetAmmoStat,
} from "./WeaponData";

interface AddWeaponFn {
  (config: WeaponConfiguration): void;
}

interface BulkAddWeaponFn {
  (config: WeaponConfiguration[]): void;
}

interface DuplicateWeaponFn {
  (id: string): void;
}

interface RemoveWeaponFn {
  (id: string): void;
}

interface UpdateWeaponFn {
  (id: string, config: WeaponConfiguration): void;
}

interface ResetFn {
  (): void;
}

interface StatScorer {
  (config: WeaponConfiguration, stats: WeaponStats): number;
}

interface ConfigFilter {
  (config: WeaponConfiguration): boolean;
}

interface MaximizingFn {
  (scorer: StatScorer): void;
}

interface Selector {
  (weapon: Weapon, stats: WeaponStats): boolean;
}

interface SelectingFn {
  (selector: Selector): void;
}

interface WeaponSelector {
  (weapon: WeaponConfigurationStats): boolean;
}

interface WeaponConfiguration {
  name: string;
  visible: boolean;
  barrelType: string;
  ammoType: string;
}

interface WeaponConfigurationStats //WeaponConfiguration,
  extends WeaponStats,
    AmmoStat {
  name: string;
}

interface WeaponConfigurationMap {
  weaponConfigurations: Map<string, WeaponConfiguration>;
  AddWeapon: AddWeaponFn;
  BulkAddWeapon: BulkAddWeaponFn;
  RemoveWeapon: RemoveWeaponFn;
  DuplicateWeapon: DuplicateWeaponFn;
  UpdateWeapon: UpdateWeaponFn;
  Reset: ResetFn;
  Maximize: MaximizingFn;
  Select: SelectingFn;
  Filter: (filterFn: ConfigFilter) => void;
  ForEach: (fn: (config: WeaponConfiguration) => void) => void;
}

interface SetConfigurationsFn {
  (configs: Map<string, WeaponConfiguration>): void;
}

function AddConfigToMap(
  config: WeaponConfiguration,
  configurations: Map<string, WeaponConfiguration>
) {
  let id = crypto.randomUUID();
  while (configurations.has(id)) {
    console.warn("Duplicate UUID generated.");
    id = crypto.randomUUID();
  }
  configurations.set(id, config);
}

function ConfigKey(config: WeaponConfiguration): string {
  return `${config.name}-${config.barrelType}-${config.ammoType}`;
}

class WeaponConfigurations implements WeaponConfigurationMap {
  weaponConfigurations: Map<string, WeaponConfiguration>;
  private setWeaponConfigurations: SetConfigurationsFn;

  constructor(
    configurations: Map<string, WeaponConfiguration>,
    setConfigurations: SetConfigurationsFn
  ) {
    if (configurations === undefined) {
      throw new Error("uh oh");
    }
    this.weaponConfigurations = configurations;
    this.setWeaponConfigurations = (configurations) => {
      setConfigurations(configurations);
      this.weaponConfigurations = configurations;
    };
  }

  BulkAddWeapon(configs: WeaponConfiguration[]) {
    const configurations = new Map(this.weaponConfigurations);
    for (const config of configs) {
      AddConfigToMap(config, configurations);
    }
    this.setWeaponConfigurations(configurations);
  }

  AddWeapon(config: WeaponConfiguration) {
    const configurations = new Map(this.weaponConfigurations);
    AddConfigToMap(config, configurations);
    this.setWeaponConfigurations(configurations);
  }

  DuplicateWeapon(id: string) {
    const config = this.weaponConfigurations.get(id);
    if (config) {
      const cloned = JSON.parse(JSON.stringify(config));
      this.AddWeapon(cloned);
    }
  }

  RemoveWeapon(id: string) {
    const configurations = new Map(this.weaponConfigurations);
    configurations.delete(id);
    this.setWeaponConfigurations(configurations);
  }

  UpdateWeapon(id: string, config: WeaponConfiguration) {
    const configurations = new Map(this.weaponConfigurations);
    configurations.set(id, config);
    this.setWeaponConfigurations(configurations);
  }

  Reset() {
    this.setWeaponConfigurations(new Map());
  }

  // From existing weapons, select the highest scoring configurations.
  Maximize(scoreStat: StatScorer) {
    const configurations = new Map();
    let differed = false;
    for (let [id, config] of this.weaponConfigurations) {
      const cloned = JSON.parse(JSON.stringify(config));
      configurations.set(id, cloned);
      const weapon = GetWeaponByName(config.name);
      let score = -Infinity;
      for (const stat of weapon.stats) {
        const _score = scoreStat(config, stat);
        if (
          _score > score ||
          (_score === score &&
            ((stat.barrelType == "Factory" &&
              cloned.barrelType !== "Factory") ||
              (stat.ammoType == "Standard" && cloned.ammoType !== "Standard")))
        ) {
          score = _score;
          cloned.barrelType = stat.barrelType;
          cloned.ammoType = stat.ammoType;
        }
      }
      if (
        cloned.barrelType !== config.barrelType ||
        cloned.ammoType != config.ammoType
      ) {
        differed = true;
      }
    }
    if (differed) {
      this.setWeaponConfigurations(configurations);
    }
  }

  // From existing weapons, select all configs which match the selector. May have more configs in configurator window afterwards.
  Select(selector: Selector) {
    const configurations = new Map();
    const seenWeapons = new Set<string>();
    for (let [_, config] of this.weaponConfigurations) {
      seenWeapons.add(config.name);
    }
    for (let name of seenWeapons) {
      const weapon = GetWeaponByName(name);
      for (const stat of weapon.stats) {
        if (selector(weapon, stat)) {
          AddConfigToMap(
            {
              name,
              barrelType: stat.barrelType,
              ammoType: stat.ammoType,
              visible: true,
            },
            configurations
          );
        }
      }
    }
    this.setWeaponConfigurations(configurations);
  }

  SelectWeapons(selector: WeaponSelector) {
    const configurations = new Map();
    for (const category of WeaponCategories) {
      for (const weapon of GetCategoryWeapons(category)) {
        let weaponStats = GetWeaponByName(weapon.name);
        let configuredStats: WeaponConfigurationStats[] = [];
        for (const stat of weaponStats.stats) {
          let ammoStat = GetAmmoStat(weaponStats, stat);
          if (ammoStat) {
            const weaponStat: WeaponConfigurationStats = {
              name: weapon.name,
              ...stat,
              ...ammoStat,
            };
            if (selector(weaponStat)) {
              configuredStats.push(weaponStat);
              AddConfigToMap(
                {
                  name: weapon.name,
                  barrelType: stat.barrelType,
                  ammoType: stat.ammoType,
                  visible: true,
                },
                configurations
              );
            }
          }
        }
      }
    }
    this.setWeaponConfigurations(configurations);
  }

  // From existing weapons, select all configs which match the selector. May have more configs in configurator window afterwards.
  SelectFromAllWeaponsInCategory(category: string, selector: Selector) {
    const configurations = new Map();
    for (const weapon of GetCategoryWeapons(category)) {
      const name = weapon.name;
      for (const stat of weapon.stats) {
        if (selector(weapon, stat)) {
          AddConfigToMap(
            {
              name,
              barrelType: stat.barrelType,
              ammoType: stat.ammoType,
              visible: true,
            },
            configurations
          );
        }
      }
    }
    this.setWeaponConfigurations(configurations);
  }

  ForEach(fn: (config: WeaponConfiguration) => void) {
    this.weaponConfigurations.forEach((value, _) => {
      fn(value);
    });
  }

  ForEachWeapon(fn: (config: WeaponConfigurationStats) => void) {
    for (let [_, config] of this.weaponConfigurations) {
      const weapon = GetWeaponByName(config.name);
      for (const stat of weapon.stats) {
        const ammoStat = GetAmmoStat(weapon, stat);
        if (ammoStat) {
          const weaponStat: WeaponConfigurationStats = {
            name: config.name,
            ...stat,
            ...ammoStat,
          };
          fn(weaponStat);
        }
      }
    }
  }

  Filter(filterFn: ConfigFilter) {
    const configurations = new Map();
    const seenConfigs = new Set<string>();
    for (let [id, config] of this.weaponConfigurations) {
      let cfgKey = ConfigKey(config);
      if (filterFn(config) && !seenConfigs.has(cfgKey)) {
        configurations.set(id, config);
        seenConfigs.add(cfgKey);
      }
    }
    this.setWeaponConfigurations(configurations);
  }

  Dedupe() {
    this.Filter((_config) => true);
  }
}

export { WeaponConfigurations };
export type {
  StatScorer,
  MaximizingFn,
  Selector,
  SelectingFn,
  WeaponConfigurationMap as WeaponConfig,
  WeaponConfiguration,
  WeaponConfigurationStats,
};
