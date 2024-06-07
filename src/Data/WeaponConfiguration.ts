import { WeaponConfiguration } from "../Components/WeaponConfigurator/WeaponConfigurator";
import { GetWeaponByName, WeaponStats } from "./WeaponData";

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

interface MaximizingFn {
  (scorer: StatScorer): void;
}

interface Selector {
  (config: WeaponConfiguration, stats: WeaponStats): boolean;
}

interface SelectingFn {
  (selector: Selector): void;
}

interface WeaponConfig {
  AddWeapon: AddWeaponFn;
  BulkAddWeapon: BulkAddWeaponFn;
  RemoveWeapon: RemoveWeaponFn;
  DuplicateWeapon: DuplicateWeaponFn;
  UpdateWeapon: UpdateWeaponFn;
  Reset: ResetFn;
  Maximize: MaximizingFn;
}

interface SetConfigurationsFn {
  (configs: Map<string, WeaponConfiguration>): void;
}

class WeaponConfigurations implements WeaponConfig {
  private weaponConfigurations: Map<string, WeaponConfiguration>;
  private setWeaponConfigurations: SetConfigurationsFn;

  constructor(
    configurations: Map<string, WeaponConfiguration>,
    setConfigurations: SetConfigurationsFn
  ) {
    if (configurations === undefined) {
      throw new Error("uh oh");
    }
    this.weaponConfigurations = configurations;
    this.setWeaponConfigurations = setConfigurations;
  }

  BulkAddWeapon(configs: WeaponConfiguration[]) {
    const configurations = new Map(this.weaponConfigurations);
    for (const config of configs) {
      let id = crypto.randomUUID();
      while (configurations.has(id)) {
        console.warn("Duplicate UUID generated.");
        id = crypto.randomUUID();
      }
      configurations.set(id, config);
    }
    this.setWeaponConfigurations(configurations);
  }

  AddWeapon(config: WeaponConfiguration) {
    const configurations = new Map(this.weaponConfigurations);
    let id = crypto.randomUUID();
    while (configurations.has(id)) {
      console.warn("Duplicate UUID generated.");
      id = crypto.randomUUID();
    }
    configurations.set(id, config);
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
}

export { WeaponConfigurations };
export type { StatScorer, MaximizingFn, Selector, SelectingFn };
