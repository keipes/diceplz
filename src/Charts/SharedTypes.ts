import { WeaponConfiguration } from "../WeaponConfigurator/WeaponConfigurator";
import { WeaponStats } from "../WeaponData";

interface SortableWeaponData {
  config: WeaponConfiguration;
  stats: WeaponStats;
}

export type { SortableWeaponData };
