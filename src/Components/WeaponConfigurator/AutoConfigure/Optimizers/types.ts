import { Modifiers } from "../../../../Data/ConfigLoader";
import { WeaponConfigurations } from "../../../../Data/WeaponConfiguration";

export interface OptimizerContext {
  configurator: WeaponConfigurations;
  modifiers: Modifiers;
}

export type RPMSelector = (stat: any) => number;
