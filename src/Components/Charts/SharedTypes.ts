import { WeaponConfiguration } from "../WeaponConfigurator/WeaponConfigurator";
import { WeaponStats } from "../../Data/WeaponData";

interface SortableWeaponData {
  config: WeaponConfiguration;
  stats: WeaponStats;
}

export type { SortableWeaponData };
