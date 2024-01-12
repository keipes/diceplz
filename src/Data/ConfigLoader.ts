import { WeaponConfiguration } from "../WeaponConfigurator/WeaponConfigurator";

interface StringVoidFn {
  (value: string): void;
}
interface ListConfigFn {
  (): string[];
}

interface ConfigLoader {
  saveConfig: StringVoidFn;
  loadConfig: StringVoidFn;
  listConfigs: ListConfigFn;
  deleteConfig: StringVoidFn;
}

interface SetConfigurationsFn {
  (configs: Map<string, WeaponConfiguration>): void;
}

interface Modifiers {
  healthMultiplier: number;
  damageMultiplier: number;
  bodyDamageMultiplier: number;
}

const DefaultModifiers: Readonly<Modifiers> = {
  healthMultiplier: 1,
  damageMultiplier: 1,
  bodyDamageMultiplier: 1,
};

interface SetModifiersFn {
  (modifiers: Modifiers): void;
}

const LOCAL_STORAGE_CONFIG_PREFIX = "SavedConfigs/";
class LocalStoreConfigLoader implements ConfigLoader {
  private configurations: Map<string, WeaponConfiguration>;
  private setConfigurations: SetConfigurationsFn;

  private modifiers: Modifiers;
  private setModifiers: SetModifiersFn;

  constructor(
    configurations: Map<string, WeaponConfiguration>,
    setConfigurations: SetConfigurationsFn,
    modifiers: Modifiers,
    setModifiers: SetModifiersFn
  ) {
    this.configurations = configurations;
    this.setConfigurations = setConfigurations;
    this.modifiers = modifiers;
    this.setModifiers = setModifiers;
  }

  saveConfig(name: string) {
    localStorage.setItem(
      LOCAL_STORAGE_CONFIG_PREFIX + name,
      JSON.stringify({
        modifiers: this.modifiers,
        configurations: Array.from(this.configurations.entries()),
      })
    );
  }
  deleteConfig(name: string) {
    localStorage.removeItem(LOCAL_STORAGE_CONFIG_PREFIX + name);
  }

  listConfigs(): string[] {
    const configNames: string[] = [];
    Object.keys(localStorage).forEach(function (key) {
      if (key.startsWith(LOCAL_STORAGE_CONFIG_PREFIX)) {
        const k2 = key.substring(LOCAL_STORAGE_CONFIG_PREFIX.length);
        configNames.push(k2);
      }
    });
    return configNames;
  }

  loadConfig(name: string) {
    const cached = localStorage.getItem(LOCAL_STORAGE_CONFIG_PREFIX + name);
    if (cached) {
      const loaded = JSON.parse(cached);
      this.setConfigurations(new Map(loaded.configurations));
      this.setModifiers(loaded.modifiers);
    }
  }
}

export { LocalStoreConfigLoader, DefaultModifiers };

export type { ConfigLoader, Modifiers };
