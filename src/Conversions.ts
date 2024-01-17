import { Modifiers } from "./Data/ConfigLoader";
import { WeaponConfiguration } from "./WeaponConfigurator/WeaponConfigurator";
import { GetWeaponByName } from "./WeaponData";

const pelletMultiplier = (config: WeaponConfiguration) => {
  const weapon = GetWeaponByName(config.name);
  let pelletMultiplier = 1;
  if (weapon.pelletCounts) {
    const pelletCount = weapon.pelletCounts[config.ammoType];
    if (pelletCount !== undefined) {
      pelletMultiplier = pelletCount;
    }
  }
  return pelletMultiplier;
};

const TTK = (
  config: WeaponConfiguration,
  modifiers: Modifiers,
  damage: number,
  rpm: number
) => {
  const ttk = Math.round(
    (1000 / (rpm / 60)) * (BTK(config, modifiers, damage) - 1)
  );
  return ttk;
};

const BTK = (
  config: WeaponConfiguration,
  modifiers: Modifiers,
  damage: number
) => {
  return Math.ceil(
    (100 * modifiers.healthMultiplier) /
      (damage *
        modifiers.damageMultiplier *
        modifiers.bodyDamageMultiplier *
        pelletMultiplier(config))
  );
};

export { TTK, BTK };
