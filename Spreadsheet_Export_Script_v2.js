const categories = [
  "Sidearms",
  "SMG",
  "Assault Rifles",
  "LMG",
  "DMR",
  "Bolt Action",
  "Shotgun/Utility",
];

function ExportStats() {
  const spreadSheet = SpreadsheetApp.getActiveSpreadsheet();
  const weaponStatsSheet = spreadSheet.getSheetByName("Weapon Stats");
  const columns = getCategoryColumns(weaponStatsSheet);
  console.log("Found " + columns.length + " categories");
  const data = {
    categories: [],
  };
  //   console.log(columns);
  const weaponRanges = getWeaponRanges(columns, weaponStatsSheet);
  //   console.log(weaponRanges);
  for (let i = 0; i < weaponRanges.length; i++) {
    const category = {
      name: categories[i],
      weapons: [],
    };
    data.categories.push(category);
    const ranges = weaponRanges[i];
    for (let j = 0; j < ranges.length; j++) {
      const range = ranges[j];
      const weapon = processWeaponRange(weaponStatsSheet, range);
      //   console.log("Weapon: " + JSON.stringify(weapon));
      category.weapons.push(weapon);
    }
  }
  displayText(JSON.stringify(data));
}

function processWeaponRange(weaponStatsSheet, weaponRange) {
  //   console.log("Processing weapon range: " + JSON.stringify(weaponRange));
  const range = weaponStatsSheet.getRange(
    weaponRange.startRow,
    weaponRange.startColumn,
    weaponRange.endRow - weaponRange.startRow + 1,
    weaponRange.endColumn - weaponRange.startColumn + 1
  );
  const values = range.getValues();
  const weaponName = values[0][0];

  // headers
  let barrelCol,
    velCol,
    dmgCol,
    rangeCol,
    rpmSingleCol,
    rpmBurstCol,
    rpmAutoCol,
    ammoCol,
    reserveCol,
    reloadCol,
    hsmCol;
  for (let i = 0; i < values[0].length; i++) {
    const header = values[0][i].toString();
    switch (header) {
      case "Barrel":
        barrelCol = i;
        break;
      case "VEL":
        velCol = i;
        break;
      case "DMG":
        dmgCol = i;
        break;
      case "RANGE":
        rangeCol = i;
        break;
      case "SF RPM":
        rpmSingleCol = i;
        break;
      case "BF RPM":
        rpmBurstCol = i;
        break;
      case "FA RPM":
        rpmAutoCol = i;
        break;
      case "Ammo":
        ammoCol = i;
        break;
      case "Reserve":
        reserveCol = i;
        break;
      case "Reload":
        reloadCol = i;
        break;
      case "HSM":
        hsmCol = i;
        break;
    }
  }
  // error if any undefined
  if (
    typeof barrelCol == "undefined" ||
    typeof velCol == "undefined" ||
    typeof dmgCol == "undefined" ||
    typeof rangeCol == "undefined" ||
    typeof rpmSingleCol == "undefined" ||
    typeof rpmBurstCol == "undefined" ||
    typeof rpmAutoCol == "undefined" ||
    typeof ammoCol == "undefined" ||
    typeof reserveCol == "undefined" ||
    typeof reloadCol == "undefined" ||
    typeof hsmCol == "undefined"
  ) {
    console.error(
      "Error: Missing column in weapon range: " +
        JSON.stringify(weaponRange) +
        " " +
        JSON.stringify(values[0])
    );
    return;
  }
  const weapon = {
    name: weaponName,
    stats: [],
    ammoStats: {},
  };
  let curStat;
  console.log("Weapon Name: " + weaponName);
  //   console.log("Values: " + JSON.stringify(values));
  let barrelType = "";
  let ammoType = "";
  function pushStat() {
    if (curStat) {
      let ammoTypes = getAmmoTypes(ammoType);
      for (const ammoType of ammoTypes) {
        let stat = JSON.parse(JSON.stringify(curStat));
        stat.ammoType = ammoType;
        weapon.stats.push(stat);
      }
    }
  }
  for (let row = 1; row < values.length; row++) {
    // check for a new weapon name
    let newWeaponName = values[row][0];
    if (newWeaponName) {
      console.error(
        "Possible overrun when scanning weapon: " +
          weaponName +
          " into: " +
          newWeaponName
      );
    }
    // check for a new ammo type
    let newAmmoType = values[row][0].toString();
    if (newAmmoType && newAmmoType !== "CellImage") {
      if (ammoType == newAmmoType) {
        // end ammo type
        pushStat();
        ammoType = "";
        barrelType = "";
        curStat = undefined;
      } else {
        // console.log("Ammo Type: " + newAmmoType);
        ammoType = newAmmoType;
      }
    }
    // check for a new barrel type indicating a new set of dropoffs
    let newBarrelType = values[row][1];
    if (newBarrelType && newBarrelType !== "Barrel") {
      if (barrelType) {
        // end barrel type
        console.log("End Barrel Type: " + barrelType);
        pushStat();
      }
      barrelType = getBarrelType(newBarrelType);
      if (barrelType) {
        console.log("Barrel Type: " + barrelType);
        curStat = {
          barrelType: barrelType,
          dropoffs: [],
        };
      }
      const velocity = matchInt(values[row][velCol]);
      if (velocity) {
        curStat.velocity = velocity;
      }
      const rpmSingle = matchInt(values[row][rpmSingleCol]);
      if (rpmSingle) {
        curStat.rpmSingle = rpmSingle;
      }
      const rpmBurst = matchInt(values[row][rpmBurstCol]);
      if (rpmBurst) {
        curStat.rpmBurst = rpmBurst;
      }
      const rpmAuto = matchInt(values[row][rpmAutoCol]);
      if (rpmAuto) {
        curStat.rpmAuto = rpmAuto;
      }
    }
    if (ammoType && barrelType) {
      // check for a new dropoff
      const damage = matchFloat(values[row][dmgCol]);
      const range = matchInt(values[row][rangeCol]);
      if (typeof damage != "undefined" && typeof range != "undefined") {
        if (curStat) {
          curStat.dropoffs.push({
            damage: damage,
            range: range,
          });
        }
      }
    }
    // ammo stats
    let ammoStatType = values[row][ammoCol];
    if (ammoStatType && ammoStatType !== "Ammo") {
      ammoStatType = ammoStatType.replace("\n", " ");
      // replace any repeated whitespace with a single space
      ammoStatType = ammoStatType.replace(/\s+/g, " ");
      let pelletCount = ammoStatType.match(/\((\d+) pellets\)/);
      ammoStatType = ammoStatType.replace(/\s*\(.*$/, "");
      if (ammoStatType === "Standard Bolts") {
        ammoStatType = "Standard Bolt";
      } else if (ammoStatType === "Explosive Bolts") {
        ammoStatType = "Explosive Bolt";
      }
      let reloadParts = values[row][reloadCol].toString().split("\n");
      weapon.ammoStats[ammoStatType] = {
        magSize: matchInt(values[row][reserveCol]),
        headshotMultiplier: matchInt(values[row][hsmCol]),
      };
      for (let i = 0; i < reloadParts.length; i++) {
        let reloadPart = reloadParts[i];
        if (reloadPart.indexOf("(0)") > -1) {
          weapon.ammoStats[ammoStatType]["emptyReload"] =
            matchFloat(reloadPart);
        } else if (reloadPart.indexOf("(r)") > -1) {
          weapon.ammoStats[ammoStatType]["tacticalReload"] =
            matchFloat(reloadPart);
        }
      }
      // try to get pellet count "(12 pellets)" from ammo name
      if (pelletCount && pelletCount.length > 1) {
        weapon.ammoStats[ammoStatType]["pelletCount"] = parseInt(
          pelletCount[1]
        );
      }

      if (weaponName === "RORSCH MK-4") {
        console.warn("RORSCH MK-4 ammo stats are hard coded " + ammoStatType);
        let ammoStat = weapon.ammoStats[ammoStatType];
        weapon.ammoStats[ammoStatType] = undefined;
        ammoStat["headshotMultiplier"] = 1.9;
        weapon.ammoStats[ammoStatType + " (Burst/Auto)"] = ammoStat;
        ammoStat = JSON.parse(JSON.stringify(ammoStat));
        ammoStat["headshotMultiplier"] = 3;
        weapon.ammoStats[ammoStatType + " (Single)"] = ammoStat;
      }
    }
  }

  // check that every stat has ammo type info
  for (let i = 0; i < weapon.stats.length; i++) {
    let stat = weapon.stats[i];
    if (!stat.ammoType) {
      console.error(
        "Error: Missing ammo type in stat: " +
          JSON.stringify(stat) +
          " for weapon: " +
          weaponName
      );
    } else {
      // check that the ammo type is in the ammo stats
      //   if (stat.ammoType === "#1 Buckshot Extended") {
      //     console.log(JSON.stringify(weapon.ammoStats));
      //   }
      if (!weapon.ammoStats[stat.ammoType]) {
        console.log(JSON.stringify(stat));
        console.log(JSON.stringify(weapon.ammoStats));
        console.error(
          "Error: Missing ammo stats for ammo type: " +
            stat.ammoType +
            " in stat: " +
            JSON.stringify(stat) +
            " for weapon: " +
            weaponName
        );
      }
    }
  }
  return weapon;
}

function getWeaponRanges(columns, weaponStatsSheet) {
  const rowStart = 6;
  const categoryRanges = [];
  let colStop = columns.length;
  // colStop = 2;
  for (let i = 0; i < colStop; i++) {
    const ranges = [];
    const range = weaponStatsSheet.getRange(
      rowStart,
      columns[i].start,
      weaponStatsSheet.getLastRow(),
      1
    );
    const values = range.getValues();
    const backgroundColors = range.getBackgrounds();
    let currentRange;
    let rowStop = values.length;
    // rowStop = 40;
    let row = 0;
    for (; row < rowStop; row++) {
      // values.length
      const weaponName = values[row][0].toString().trim();
      // background color black, not part of a range, contains text
      if (
        (backgroundColors[row][0] === "#000000" ||
          backgroundColors[row][0] === "#444444") &&
        weaponName &&
        weaponName !== "CellImage"
      ) {
        console.log(
          "Found weapon name in black cell: " +
            weaponName +
            " at row " +
            row +
            rowStart
        );
        if (currentRange) {
          currentRange.endRow = row + rowStart - 1;
          ranges.push(currentRange);
        }
        currentRange = {
          startColumn: columns[i].start,
          endColumn: columns[i].end,
          startRow: row + rowStart,
        };
      }
    }
    if (currentRange) {
      currentRange.endRow = row + 1;
      ranges.push(currentRange);
    }
    categoryRanges.push(ranges);
  }
  return categoryRanges;
}

function getCategoryColumns(weaponStatsSheet) {
  const firstRow = weaponStatsSheet.getRange(
    3,
    1,
    1,
    weaponStatsSheet.getLastColumn() + 1
  );
  const merged = firstRow.getMergedRanges();
  const ranges = [];
  for (const range of merged) {
    const startColumn = range.getColumn();
    const endColumn = startColumn + range.getWidth() - 1;
    // console.log("Found merged range: " + startColumn + " to " + endColumn);
    ranges.push({
      start: startColumn,
      end: endColumn,
    });
  }
  return ranges;
}

const BarrelTypes = {
  Factory: [/Factory/, /Default/, /CCN/, /\//, /\(Wrapped\)/],
  Extended: [/Extended/],
  Shortened: [/Shortened/],
  GAR45: [/GAR45/],
  "Spook Y": [/Spook Y/],
  "NVK-SHH": [/NVK-SHH/],
  "NVK-BOX": [/NVK-BOX/],
  "6KU": [/6KU/],
  PB: [/PB/],
  "Type 4": [/Type 4/],
  Heavy: [/Heavy/],
};
function getBarrelType(barrelType) {
  for (const key in BarrelTypes) {
    for (const regex of BarrelTypes[key]) {
      if (barrelType.search(regex) > -1) {
        return key;
      }
    }
  }
  console.warn("Unrecognized barrel type: " + barrelType);
  return "";
}

const AmmoTypeMap = {
  ST: "Standard",
  DEF: "Default",
  CC: "Close Combat",
  SS: "Subsonic",
  AM: "Anti-Material",
  AMHP: "Anti-Material High Power",
  HP: "High Power",
  AP: "Armor Piercing",
  FL: "Flechette",
  "#01": "#01 Buckshot",
  "#1": "#1 Buckshot",
  "#00": "#00 Buckshot", // spreadsheet displays this as #00, but ingame it is #01
  "#4": "#4 Buckshot",
  SL: "Slug",
  BR: "Bolt Rack",
  SB: "Standard Bolt",
  EB: "Explosive Bolt",
  SSCC: "Subsonic Close Combat",
  SSHP: "Subsonic High Power",
};

function getAmmoTypes(ammoTypeKey) {
  let ammoTypes = [];
  let ammoTypeKeys = ammoTypeKey.split("|").map((x) => x.trim());
  for (const key of ammoTypeKeys) {
    let ammo = AmmoTypeMap[key];
    if (!ammo && key.endsWith("E")) {
      ammo = AmmoTypeMap[key.substring(0, key.length - 1)];
      if (ammo) {
        ammo += " Extended";
      }
    }
    if (!ammo && key.endsWith("BF")) {
      ammo = AmmoTypeMap[key.substring(0, key.length - 2)];
      if (ammo) {
        ammo += " Beltfed";
      }
    }
    if (!ammo && key.endsWith("D")) {
      ammo = AmmoTypeMap[key.substring(0, key.length - 1)];
      if (ammo) {
        ammo += " Drum";
      }
    }
    if (!ammo && key.endsWith(" (BF/FA)")) {
      ammo = AmmoTypeMap[key.substring(0, key.length - 8)];
      if (ammo) {
        ammo += " (Burst/Auto)";
      }
    }
    if (!ammo && key.endsWith(" (SF)")) {
      ammo = AmmoTypeMap[key.substring(0, key.length - 5)];
      if (ammo) {
        ammo += " (Single)";
      }
    }
    if (ammo) {
      ammoTypes.push(ammo);
    } else if (key.indexOf("My two cents:") == -1) {
      console.warn("Unrecognized ammo type: " + key);
    }
  }
  return ammoTypes;
}

function matchInt(value) {
  if (typeof value == "number") {
    return value;
  } else if (typeof value == "string") {
    const m = value.match(/[\d^ ]+/);
    if (m && m.length > 0) {
      return parseInt(m[0]);
    }
  }
}

function matchFloat(value) {
  if (typeof value == "number") {
    return value;
  } else if (typeof value == "string") {
    const m = value.replace(",", ".").match(/[\d.]+/);
    if (m && m.length > 0) {
      return parseFloat(m[0]);
    }
  }
  return undefined;
}

function displayText(text) {
  var output = HtmlService.createHtmlOutput(
    "<textarea style='width:100%;' rows='20'>" + text + "</textarea>"
  );
  output.setWidth(800);
  output.setHeight(400);
  SpreadsheetApp.getUi().showModalDialog(output, "Exported JSON");
}
