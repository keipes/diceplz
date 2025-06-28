import { ConfigDisplayName } from "./LabelMaker";
import { WeaponConfiguration } from "../Components/WeaponConfigurator/WeaponConfigurator";

const cyrb53 = function (str: string, seed = 0) {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

const StringHue = function (str: string | undefined) {
  if (str === undefined) return 360;
  const hue = (cyrb53(str) / Math.pow(2, 53)) * 360;
  return hue;
};

const ConfigHSL = function (config: WeaponConfiguration) {
  return ConfigHSLFromName(ConfigDisplayName(config));
};

const ConfigHSLFromName = function (name: string) {
  return "hsl(" + StringHue(name) + ", 50%, 50%)";
};

const ConfigAmmoColor = function (config: WeaponConfiguration) {
  let aT = config.ammoType;
  if (aT === undefined) {
    // alert
    console.warn(
      "ConfigAmmoColor called with undefined ammoType for config:",
      config
    );
  }
  if (aT.endsWith(" Extended")) {
    aT = aT.substring(0, aT.length - 9);
  }
  if (aT.endsWith(" Beltfed")) {
    aT = aT.substring(0, aT.length - 8);
  }
  if (aT.endsWith(" Drum")) {
    aT = aT.substring(0, aT.length - 5);
  }
  switch (aT) {
    case "Close Combat":
      return "#7fffff";
    case "Standard":
      return "#7fff7f";
    case "High Power":
      return "#ff7f7f";
    case "Subsonic":
      return "#7f7fff";
    case "Armor Piercing":
    case "Anti-Material":
    case "Anti-Material High Power":
      return "#ffff7f";
    default:
      return "#fff";
  }
};

export default StringHue;
export { ConfigHSL, ConfigHSLFromName, ConfigAmmoColor };
