import { Modifiers } from "../Data/ConfigLoader";
import { WeaponConfiguration } from "../Components/WeaponConfigurator/WeaponConfigurator";
import { GetWeaponByName } from "../Data/WeaponData";

const pelletMultiplier = (config: WeaponConfiguration) => {
  const weapon = GetWeaponByName(config.name);
  let pelletMultiplier = 1;
  if (weapon.ammoStats) {
    const ammoStats = weapon.ammoStats[config.ammoType];
    if (ammoStats && ammoStats.pelletCount !== undefined) {
      pelletMultiplier = ammoStats.pelletCount;
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
  // Weapons doing 99.75 damage have resulted in a kill. Assumed max player health is 99.5, from 2043 discord.
  const playerHealth = 100 * modifiers.healthMultiplier - 0.5;
  return Math.ceil(
    playerHealth /
      (damage *
        modifiers.damageMultiplier *
        modifiers.bodyDamageMultiplier *
        pelletMultiplier(config))
  );
};

export { TTK, BTK };
