function myFunction() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  const data = {
    categories: [],
  };
  const _categoriesIndex = new Map();
  const getCategory = (name) => {
    let category = _categoriesIndex.get(name);
    if (!category) {
      category = {
        name: name,
        weapons: [],
      };
      _categoriesIndex.set(name, category);
      data.categories.push(category);
    }
    return category;
  };
  for (let i = 7; i < sheets.length; i++) {
    // for (let i = 60; i < 62; i++) {
    // for (let i = 62; i < 63; i++) {
    // for (let i = 7; i < 8; i++) {
    // for (let i = 67; i < 68; i++) {
    //sheets.length
    const sheet = sheets[i];
    const colorObject = sheet.getTabColorObject();
    const tabColorHex = colorObject.asRgbColor().asHexString();
    switch (tabColorHex) {
      case "#ffffff":
        // title page
        // console.log('skip');
        break;
      case "#000000":
        // non-weapon data
        // console.log('skip');
        break;
      case "#ffff00":
        processSheet(data, "Sidearms", sheet, getCategory);
        break;
      case "#00ff00":
        processSheet(data, "SMG", sheet, getCategory);
        break;
      case "#ff0000":
        processSheet(data, "Assault Rifles", sheet, getCategory);
        break;
      case "#0000ff":
        processSheet(data, "LMG", sheet, getCategory);
        break;
      case "#ff9900":
        processSheet(data, "DMR", sheet, getCategory);
        break;
      case "#9900ff":
        processSheet(data, "Bolt Action", sheet, getCategory);
        break;
      case "#00ffff":
        processSheet(data, "Shotgun/Utility", sheet, getCategory);
        break;
      default:
        console.warn("Unrecognized tab color: " + tabColorHex);
        break;
    }
  }
  // console.log(data);
  displayText(JSON.stringify(data));
}

function processSheet(data, category, sheet, getCategory) {
  console.log(sheet.getName());
  // if (!data[category]) {
  //   data[category] = [];
  // }
  const weaponData = {
    name: sheet.getName(),
    stats: [],
  };
  const categoryData = getCategory(category);
  categoryData.weapons.push(weaponData);
  const damageValues = {};
  let currentAmmoType = "";
  let currentBarrelType = "";
  const range = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn());
  const values = range.getValues();
  const mergedRanges = range.getMergedRanges();
  const mergedRows = {};
  for (let i = 0; i < mergedRanges.length; i++) {
    if (mergedRanges[i].getColumn() == 4) {
      mergedRows[mergedRanges[i].getRow()] = mergedRanges[i].getEndRow();
    }
  }
  const seenConfigurations = {};
  for (let i in values) {
    const ammoType = values[i][1].toString();
    if (ammoType && ammoType != "x" && ammoType != currentAmmoType) {
      if (ammoType == "x" || ammoType == "CellImage") {
        // skip these
      } else if (ammoType.search(/ST/) > -1) {
        currentAmmoType = "Standard";
      } else if (ammoType.search(/DEF/) > -1) {
        currentAmmoType = "Default";
      } else if (ammoType.search(/CC/) > -1) {
        currentAmmoType = "Close Combat";
      } else if (ammoType.search(/SS/) > -1) {
        currentAmmoType = "Subsonic";
      } else if (ammoType.search(/AM/) > -1) {
        currentAmmoType = "Anti-Material";
      } else if (ammoType.search(/AMHP/) > -1) {
        currentAmmoType = "Anti-Material High Powerr";
      } else if (ammoType.search(/HP/) > -1) {
        currentAmmoType = "High Power";
      } else if (ammoType.search(/AP/) > -1) {
        if (ammoType.search(/BF\/FA/) > -1) {
          currentAmmoType = "Armor Piercing (Burst/Auto)";
        } else if (ammoType.search(/SF/) > -1) {
          currentAmmoType = "Armor Piercing (Single)";
        } else {
          currentAmmoType = "Armor Piercing";
        }
      } else if (ammoType.search(/FL/) > -1) {
        currentAmmoType = "Flechette";
      } else if (ammoType.search(/#01/) > -1) {
        currentAmmoType = "#01 Buckshot";
      } else if (ammoType.search(/#00/) > -1) {
        currentAmmoType = "#01 Buckshot"; // spreadsheet displays this as #00, but ingame it is #01
      } else if (ammoType.search(/#4/) > -1) {
        currentAmmoType = "#4 Buckshot";
      } else if (ammoType.search(/SL/) > -1) {
        currentAmmoType = "Slug";
      } else if (ammoType.search(/BR/) > -1) {
        currentAmmoType = "Bolt Rack";
      } else if (ammoType.search(/SB/) > -1) {
        currentAmmoType = "Standard Bolt";
      } else if (ammoType.search(/EB/) > -1) {
        currentAmmoType = "Explosive Bolt";
      } else {
        // console.warn("Unrecognized ammo type for " + sheet.getName() + " : " + ammoType);
        currentAmmoType = "";
      }
    }

    const barrelType = values[i][2].toString();
    if (
      barrelType &&
      barrelType != "Comparison Tool" &&
      barrelType != "Barrel (Damage Modifier)"
    ) {
      if (
        barrelType.search(/Factory/) > -1 ||
        barrelType.search(/Default/) > -1 ||
        barrelType.search(/CCN/) > -1
      ) {
        currentBarrelType = "Factory";
      } else if (barrelType.search(/Extended/) > -1) {
        currentBarrelType = "Extended";
      } else if (barrelType.search(/Shortened/) > -1) {
        currentBarrelType = "Shortened";
      } else if (barrelType.search(/GAR45/) > -1) {
        currentBarrelType = "GAR45";
      } else if (barrelType.search(/Spook Y/) > -1) {
        currentBarrelType = "Spook Y";
      } else if (barrelType.search(/NVK-SHH/) > -1) {
        currentBarrelType = "NVK-SHH";
      } else if (barrelType.search(/NVK-BOX/) > -1) {
        currentBarrelType = "NVK-BOX";
      } else if (barrelType.search(/6KU/) > -1) {
        currentBarrelType = "6KU";
      } else if (barrelType.search(/PB/) > -1) {
        currentBarrelType = "PB";
      } else if (barrelType.search(/Type 4/) > -1) {
        currentBarrelType = "Type 4";
      } else if (barrelType.search(/Heavy/) > -1) {
        currentBarrelType = "Heavy";
      } else {
        console.warn(
          "Unrecognized barrel type for " + sheet.getName() + " : " + barrelType
        );
        currentBarrelType = "";
      }
    }

    const shotgunAmmoTypes = {
      Flechette: true,
      "#01 Buckshot": true,
      "#00 Buckshot": true,
      "#4 Buckshot": true,
      Slug: true,
    };
    let ammoCountType = values[i][15].toString();
    if (
      ammoCountType &&
      ammoCountType !== "CellImage" &&
      ammoCountType !== "Ammunition"
    ) {
      let shottyOffset = 0;
      let pelletCount;
      if (shotgunAmmoTypes[ammoCountType]) {
        shottyOffset = 1;
        if (ammoCountType == "#00 Buckshot") {
          ammoCountType = "#01 Buckshot";
        }
        pelletCount = matchInt(values[i][16]);
        // if (weaponData.pelletCounts == undefined) {
        //   weaponData.pelletCounts = {};
        // }
        // if (weaponData.pelletCounts[ammoCountType]) {
        //   console.warn(
        //     "skipping duplicate pellet type " +
        //       weaponData.name +
        //       " " +
        //       ammoCountType
        //   );
        // } else {
        //   weaponData.pelletCounts[ammoCountType] = pelletCount;
        // }
      }

      const magSize = matchInt(values[i][16 + shottyOffset]);
      let reload;
      let reloadTactical;
      const reloadValue = "" + values[i][17 + shottyOffset];
      let m = reloadValue.match(/[\d^ ,]+\W+\(empty\)/);
      if (m && m.length > 0) {
        const valStr = m[0].replace(",", ".");
        reload = parseFloat(valStr);
      } else {
        const valStr = reloadValue;
        reload = parseFloat(valStr);
        if (isNaN(reload)) reload = undefined;
      }

      m = reloadValue.match(/[\d^ ,]+\W+\(tactical\)/);
      if (m && m.length > 0) {
        const valStr = m[0].replace(",", ".");
        reloadTactical = parseFloat(valStr);
      }
      const headshotMultiplier = parseFloat(
        values[i][18 + shottyOffset].replace(",", ".")
      );
      const ammoStat = {
        magSize: magSize,
        emptyReload: reload,
        tacticalReload: reloadTactical,
        headshotMultiplier: headshotMultiplier,
        pelletCount: pelletCount,
      };
      if (!weaponData.ammoStats) {
        weaponData.ammoStats = {};
      }
      if (weaponData.ammoStats[ammoCountType]) {
        // console.warn(
        //   "skipping duplicate ammo type " +
        //     weaponData.name +
        //     " " +
        //     ammoCountType
        // );
      } else {
        weaponData.ammoStats[ammoCountType] = ammoStat;
      }
      // console.log(weaponData.ammoStats);
    }
    // if (shotgunAmmoTypes[ammoCountType]) {
    //   if (ammoCountType == '#00 Buckshot') {
    //     ammoCountType = '#01 Buckshot';
    //   }
    //   const pelletCount = matchInt(values[i][16]);
    //   if (weaponData.pelletCounts == undefined) {
    //     weaponData.pelletCounts = {};
    //   }
    //   if (weaponData.pelletCounts[ammoCountType]) {
    //     console.warn(
    //       "skipping duplicate pellet type " +
    //         weaponData.name +
    //         " " +
    //         ammoCountType
    //     );
    //   } else {
    //     weaponData.pelletCounts[ammoCountType] = pelletCount;
    //   }
    // } else {
    //   const magSize = matchInt(values[i][16]);
    //   let reload;
    //   let reloadTactical;
    //   const reloadValue = values[i][17];
    //   let m = reloadValue.match(/[\d^ ,]+\W+\(empty\)/);
    //   if (m && m.length > 0) {
    //     const valStr = m[0].replace(',', '.');
    //     reload = parseFloat(valStr);
    //   }
    //   m = reloadValue.match(/[\d^ ,]+\W+\(tactical\)/);
    //   if (m && m.length > 0) {
    //     const valStr = m[0].replace(',', '.');
    //     reloadTactical = parseFloat(valStr);
    //   }
    //   const headshotMultiplier = parseFloat(values[i][18].replace(',', '.'));
    //   const ammoStat = {
    //     magSize: magSize,
    //     emptyReload: reload,
    //     reloadTactical: reloadTactical,
    //     headshotMultiplier: headshotMultiplier
    //   }
    //   ammoMetadata.set(ammoCountType, ammoStat);
    //   if (!weaponData.ammoStats) {
    //     weaponData.ammoStats = {};
    //   }
    //   weaponData.ammoStats[ammoCountType] = ammoStat;
    //   console.log(weaponData.ammoStats);
    // }

    if (currentBarrelType != "" && currentAmmoType != "") {
      const startRow = parseInt(i) + 1;
      let endRow = mergedRows[startRow];
      if (!endRow && values[i][5] == "0 ~") {
        endRow = startRow;
      }
      if (endRow && currentAmmoType != "") {
        const stats = {};
        stats.barrelType = currentBarrelType;
        stats.ammoType = currentAmmoType;
        stats.dropoffs = processDropoff(values, startRow - 1, endRow + 1);
        // weaponData[currentAmmoType][currentBarrelType]['dropoff'] = processDropoff(values, startRow - 1, endRow + 1);
        const velocity = matchInt(values[i][3]);
        if (velocity) {
          stats.velocity = velocity;
        }
        const rpmSingle = matchInt(values[i][10]);
        if (rpmSingle) {
          stats.rpmSingle = rpmSingle;
        }
        const rpmBurst = matchInt(values[i][11]);
        if (rpmBurst) {
          stats.rpmBurst = rpmBurst;
        }
        const rpmAuto = matchInt(values[i][12]);
        if (rpmAuto) {
          stats.rpmAuto = rpmAuto;
        }
        if (seenConfigurations[stats.barrelType] == undefined) {
          seenConfigurations[stats.barrelType] = {};
        }
        if (!seenConfigurations[stats.barrelType][stats.ammoType]) {
          weaponData.stats.push(stats);
          seenConfigurations[stats.barrelType][stats.ammoType] = true;
          // console.log(weaponData.name + " " + stats.barrelType + " " + stats.ammoType);
        } else {
          // console.warn("Skipping duplicate configuration for " + weaponData.name);
        }
      }
    }
  }
  if (weaponData.name == "GHOSTMAKER R10") {
    if (
      !seenConfigurations["Factory"] ||
      !seenConfigurations["Factory"]["Explosive Bolt"]
    ) {
      weaponData.stats.push({
        barrelType: "Factory",
        ammoType: "Explosive Bolt",
        dropoffs: [{ damage: 132.5, range: 0 }],
      });
      console.warn(
        "Ghostmaker explosive bolts added from script, not read from spreadsheet."
      );
    }
  }
  // for (const stat of weaponData.stats) {
  //   const metadata = ammoMetadata.get(stat.ammoType);
  //   if (metadata) {
  //     console.log(stat.ammoType);
  //     console.log(metadata);
  //   }
  // }
}

function processDropoff(values, startRow, endRow) {
  const dropoffs = [];
  for (let i = startRow; i < endRow - 1; i++) {
    const damage = matchInt(values[i][4]);
    const distance = matchInt(values[i][5]);
    if (typeof damage != "undefined" && typeof distance != "undefined") {
      dropoffs.push({
        damage: damage,
        range: distance,
      });
    }
  }
  return dropoffs;
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

function displayText(text) {
  var output = HtmlService.createHtmlOutput(
    "<textarea style='width:100%;' rows='20'>" + text + "</textarea>"
  );
  output.setWidth(800);
  output.setHeight(400);
  SpreadsheetApp.getUi().showModalDialog(output, "Exported JSON");
}
