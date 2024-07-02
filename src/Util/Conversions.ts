import { Modifiers } from "../Data/ConfigLoader";
import { WeaponConfiguration } from "../Components/WeaponConfigurator/WeaponConfigurator";
import { GetStatsForConfiguration, GetWeaponByName } from "../Data/WeaponData";

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
  damage: number,
  numHeadshots?: number
) => {
  const weapon = GetWeaponByName(config.name);
  let hsm = 1;
  if (weapon.ammoStats) {
    hsm = weapon.ammoStats[config.ammoType]?.headshotMultiplier || 1;
  }
  let btk = 0;
  // Weapons doing 99.75 damage have resulted in a kill. Assumed max player health is 99.5, from 2043 discord.
  let playerHealth =
    100 * modifiers.healthMultiplier - 0.5 + (modifiers.bodyArmor ? 20 : 0);
  if (numHeadshots) {
    for (let i = 0; i < numHeadshots; i++) {
      btk += 1;
      playerHealth -=
        damage * hsm * modifiers.damageMultiplier * pelletMultiplier(config);
      if (playerHealth <= 0) {
        break;
      }
    }
  }
  if (playerHealth <= 0) {
    return btk;
  } else {
    let r =
      btk +
      Math.ceil(
        playerHealth /
          (damage *
            modifiers.damageMultiplier *
            modifiers.bodyDamageMultiplier *
            pelletMultiplier(config))
      );
    return r;
  }
};

const DamageAtRange = (config: WeaponConfiguration, range: number) => {
  let damage = 0;
  const stat = GetStatsForConfiguration(config);
  for (const dropoff of stat.dropoffs) {
    if (dropoff.range <= range) {
      damage = dropoff.damage;
    } else {
      break;
    }
  }
  return damage;
};

const MagazineCapacity = (config: WeaponConfiguration) => {
  const weapon = GetWeaponByName(config.name);
  if (weapon.ammoStats) {
    const ammoStat = weapon.ammoStats[config.ammoType];
    if (ammoStat) {
      if (ammoStat.magSize) {
        return ammoStat.magSize;
      }
    }
  }
  return 0;
};

const KillsPerMag = (
  config: WeaponConfiguration,
  modifiers: Modifiers,
  range: number
) => {
  const btk = BTK(config, modifiers, DamageAtRange(config, range));
  const magSize = MagazineCapacity(config);
  return Math.floor(magSize / btk);
};
export { TTK, BTK, KillsPerMag };
