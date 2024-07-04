import { WeaponConfiguration } from "../Components/WeaponConfigurator/WeaponConfigurator";

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
  bodyArmor: boolean;
}

const DefaultModifiers: Readonly<Modifiers> = {
  healthMultiplier: 1,
  damageMultiplier: 1,
  bodyDamageMultiplier: 1,
  bodyArmor: false,
};

interface SetModifiersFn {
  (modifiers: Modifiers): void;
}

const LOCAL_STORAGE_CONFIG_PREFIX = "SavedConfigs/";
class WebStoreConfigLoader implements ConfigLoader {
  private configurations: Map<string, WeaponConfiguration>;
  private setConfigurations: SetConfigurationsFn;

  private modifiers: Modifiers;
  private setModifiers: SetModifiersFn;
  private storage: Storage;

  constructor(
    configurations: Map<string, WeaponConfiguration>,
    setConfigurations: SetConfigurationsFn,
    modifiers: Modifiers,
    setModifiers: SetModifiersFn,
    storage: Storage
  ) {
    this.configurations = configurations;
    this.setConfigurations = setConfigurations;
    this.modifiers = modifiers;
    this.setModifiers = setModifiers;
    this.storage = storage;
  }

  saveConfig(name: string) {
    this.storage.setItem(
      LOCAL_STORAGE_CONFIG_PREFIX + name,
      JSON.stringify({
        modifiers: this.modifiers,
        configurations: Array.from(this.configurations.entries()),
      })
    );
  }
  deleteConfig(name: string) {
    this.storage.removeItem(LOCAL_STORAGE_CONFIG_PREFIX + name);
  }

  listConfigs(): string[] {
    const configNames: string[] = [];
    Object.keys(this.storage).forEach(function (key) {
      if (key.startsWith(LOCAL_STORAGE_CONFIG_PREFIX)) {
        const k2 = key.substring(LOCAL_STORAGE_CONFIG_PREFIX.length);
        configNames.push(k2);
      }
    });
    return configNames;
  }

  loadConfig(name: string) {
    const cached = this.storage.getItem(LOCAL_STORAGE_CONFIG_PREFIX + name);
    if (cached) {
      const loaded = JSON.parse(cached);
      this.setConfigurations(new Map(loaded.configurations));
      this.setModifiers(loaded.modifiers);
    }
  }
}

class LocalStoreConfigLoader extends WebStoreConfigLoader {
  constructor(
    configurations: Map<string, WeaponConfiguration>,
    setConfigurations: SetConfigurationsFn,
    modifiers: Modifiers,
    setModifiers: SetModifiersFn
  ) {
    super(
      configurations,
      setConfigurations,
      modifiers,
      setModifiers,
      localStorage
    );
  }
}

class SessionStoreConfigLoader extends WebStoreConfigLoader {
  constructor(
    configurations: Map<string, WeaponConfiguration>,
    setConfigurations: SetConfigurationsFn,
    modifiers: Modifiers,
    setModifiers: SetModifiersFn
  ) {
    super(
      configurations,
      setConfigurations,
      modifiers,
      setModifiers,
      sessionStorage
    );
  }
}

const DEFAULT_SESSION_CONFIG_NAME = "default-session-config";

function LoadInitialSessionData(): [
  Map<string, WeaponConfiguration>,
  Modifiers
] {
  let configurations = new Map();
  let modifiers = DefaultModifiers;
  const configLoader = new SessionStoreConfigLoader(
    configurations,
    (configs) => {
      configurations = configs;
    },
    modifiers,
    (mods) => {
      modifiers = mods;
    }
  );
  configLoader.loadConfig(DEFAULT_SESSION_CONFIG_NAME);
  return [configurations, modifiers];
}

export {
  LocalStoreConfigLoader,
  SessionStoreConfigLoader,
  DefaultModifiers,
  DEFAULT_SESSION_CONFIG_NAME,
  LoadInitialSessionData,
};

export type { ConfigLoader, Modifiers };
