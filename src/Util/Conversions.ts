import { Modifiers } from "../Data/ConfigLoader";
import { WeaponConfiguration } from "../Components/WeaponConfigurator/WeaponConfigurator";
import {
  AmmoStat,
  GetStatsForConfiguration,
  GetWeaponByName,
} from "../Data/WeaponData";

function TTK(
  config: WeaponConfiguration,
  modifiers: Modifiers,
  damage: number,
  rpm: number,
  numHeadshots?: number,
  includeFirstShotDelay = false
) {
  const weapon = GetWeaponByName(config.name);
  return TTK2(
    modifiers,
    damage,
    rpm,
    numHeadshots,
    weapon.ammoStats?.[config.ammoType],
    includeFirstShotDelay
  );
}

function TTK2(
  modifiers: Modifiers,
  damage: number,
  rpm: number,
  numHeadshots?: number,
  ammoStats?: AmmoStat | undefined,
  includeFirstShotDelay = false
) {
  let offset = includeFirstShotDelay ? 0 : 1;
  const ttk = Math.round(
    (1000 / (rpm / 60)) *
      (BTK2(modifiers, damage, numHeadshots, ammoStats) - offset)
  );
  return ttk;
}

const AverageTTK = (
  config: WeaponConfiguration,
  modifiers: Modifiers,
  damage: number,
  rpm: number,
  headshotRatio: number,
  includeFirstShotDelay = false
) => {
  let weapon = GetWeaponByName(config.name);
  return AverageTTK2(
    modifiers,
    damage,
    rpm,
    headshotRatio,
    weapon.ammoStats?.[config.ammoType],
    includeFirstShotDelay
  );
};

function AverageTTK2(
  modifiers: Modifiers,
  damage: number,
  rpm: number,
  headshotRatio: number,
  ammoStats?: AmmoStat,
  includeFirstShotDelay = false
) {
  let ttk = Infinity;
  let minTTK = TTK2(
    modifiers,
    damage,
    rpm,
    Infinity,
    ammoStats,
    includeFirstShotDelay
  );
  let sumTTK = 0;
  let sumProbabilities = 0;
  for (let headshots = 0; ttk > minTTK; headshots++) {
    ttk = TTK2(
      modifiers,
      damage,
      rpm,
      headshots,
      ammoStats,
      includeFirstShotDelay
    );
    if (headshots === 0) {
      sumProbabilities += 1 - headshotRatio;
      sumTTK += ttk * (1 - headshotRatio);
    } else {
      const probability = Math.pow(headshotRatio, headshots); // * (1 - headshotRatio);
      sumProbabilities += probability;
      sumTTK += ttk * probability;
    }
  }
  return sumTTK / sumProbabilities;
}

const AverageBTK = (
  config: WeaponConfiguration,
  modifiers: Modifiers,
  damage: number,
  headshotRatio: number
) => {
  let weapon = GetWeaponByName(config.name);
  return AverageBTK2(
    modifiers,
    damage,
    headshotRatio,
    weapon.ammoStats?.[config.ammoType]
  );
};

function AverageBTK2(
  modifiers: Modifiers,
  damage: number,
  headshotRatio: number,
  ammoStats?: AmmoStat
) {
  let btk = Infinity;
  let minBTK = BTK2(modifiers, damage, Infinity, ammoStats);
  let sumBTK = 0;
  let sumProbabilities = 0;
  for (let headshots = 0; btk > minBTK; headshots++) {
    btk = BTK2(modifiers, damage, headshots, ammoStats);
    if (headshots === 0) {
      sumProbabilities += 1 - headshotRatio;
      sumBTK += btk * (1 - headshotRatio);
    } else {
      const probability = Math.pow(headshotRatio, headshots); // * (1 - headshotRatio);
      sumProbabilities += probability;
      sumBTK += btk * probability;
    }
  }
  return sumBTK / sumProbabilities;
}

const BTK = (
  config: WeaponConfiguration,
  modifiers: Modifiers,
  damage: number,
  numHeadshots?: number
) => {
  const weapon = GetWeaponByName(config.name);
  if (weapon.ammoStats) {
    return BTK2(
      modifiers,
      damage,
      numHeadshots,
      weapon.ammoStats[config.ammoType]
    );
  }
  return BTK2(modifiers, damage, numHeadshots);
};

const BTK2 = (
  modifiers: Modifiers,
  damage: number,
  numHeadshots?: number,
  ammoStats?: AmmoStat
) => {
  let pelletMultiplier = 1;
  if (ammoStats && ammoStats.pelletCount !== undefined) {
    pelletMultiplier = ammoStats.pelletCount;
  }
  let hsm = 1;
  if (ammoStats) {
    hsm = ammoStats.headshotMultiplier || 1;
  }
  let btk = 0;
  // Weapons doing 99.75 damage have resulted in a kill. Assumed max player health is 99.5, from 2043 discord.
  let playerHealth =
    100 * modifiers.healthMultiplier - 0.5 + (modifiers.bodyArmor ? 20 : 0);
  if (numHeadshots) {
    for (let i = 0; i < numHeadshots; i++) {
      btk += 1;
      playerHealth -=
        damage * hsm * modifiers.damageMultiplier * pelletMultiplier;
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
            pelletMultiplier)
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

export {
  TTK,
  TTK2,
  AverageTTK,
  AverageTTK2,
  BTK,
  BTK2,
  AverageBTK,
  AverageBTK2,
  KillsPerMag,
};
