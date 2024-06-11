function myFunction() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  const exporter = new Exporter();
  for (let i = 7; i < sheets.length; i++) {
    //   for (let i = 71; i < sheets.length; i++) {
    exporter.processSheet(sheets[i]);
  }
  displayText(JSON.stringify(exporter.data));
}

const TabColorToCategory = {
  "#ffffff": "Ignore",
  "#000000": "Ignore",
  "#ffff00": "Sidearms",
  "#00ff00": "SMG",
  "#ff0000": "Assault Rifles",
  "#0000ff": "LMG",
  "#ff9900": "DMR",
  "#9900ff": "Bolt Action",
  "#00ffff": "Shotgun/Utility",
};

class Exporter {
  constructor() {
    this.data = {
      categories: [],
    };
    this._categoriesIndex = new Map();
  }

  processSheet(sheet) {
    const colorObject = sheet.getTabColorObject();
    const tabColorHex = colorObject.asRgbColor().asHexString();
    const category = TabColorToCategory[tabColorHex];
    if (!category) {
      console.warn("Unrecognized tab color: " + tabColorHex);
      return;
    } else if (category === "Ignore") {
      return;
    }
    this.processWeaponSheet(category, sheet);
  }

  getCategory(name) {
    let category = this._categoriesIndex.get(name);
    if (!category) {
      console.log("Create new category: " + name);
      category = {
        name: name,
        weapons: [],
      };
      this._categoriesIndex.set(name, category);
      this.data.categories.push(category);
    }
    return category;
  }

  processWeaponSheet(category, sheet) {
    const categoryData = this.getCategory(category);
    const sheetExporter = new WeaponSheetExporter(sheet.getName());
    console.log("Processing sheet: " + sheet.getName());
    categoryData.weapons.push(sheetExporter.weaponData);
    const range = sheet.getRange(
      1,
      1,
      sheet.getLastRow(),
      sheet.getLastColumn()
    );
    const values = range.getValues(); // 2d array [row][column]
    // On Sorrow's spreadsheet merged ranges are used to group ammo types together.
    // By finding the end of a merged range we can determine the end of an ammo type's data
    const mergedRanges = range.getMergedRanges();
    const mergedRows = {};
    let endRow = Infinity;
    for (let i = 0; i < mergedRanges.length; i++) {
      if (mergedRanges[i].getColumn() == 4) {
        mergedRows[mergedRanges[i].getRow()] = mergedRanges[i].getEndRow();
      } else if (
        mergedRanges[i].getLastColumn() - mergedRanges[i].getColumn() >=
        19
      ) {
        // a row spanning 19 columns or more indicates a patch boundary,
        // stop processing rows after this point
        let row = mergedRanges[i].getRow();
        if (row < endRow) {
          endRow = row;
        }
      }
    }
    for (let i in values) {
      sheetExporter.processRow(values, i, mergedRows);
      if (i > endRow) {
        console.log(
          "End of current patch data reached, stopping processing at row " + i
        );
        break;
      }
    }
    // special case for Ghostmaker R10
    if (sheetExporter.weaponData.name == "GHOSTMAKER R10") {
      if (!sheetExporter.seenConfigurations.has("FactoryExplosive Bolt")) {
        sheetExporter.weaponData.stats.push({
          barrelType: "Factory",
          ammoType: "Explosive Bolt",
          dropoffs: [{ damage: 132.5, range: 0 }],
        });
        console.warn(
          "Ghostmaker explosive bolts added from script, not read from spreadsheet."
        );
      }
    }
  }
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
  "#00": "#01 Buckshot", // spreadsheet displays this as #00, but ingame it is #01
  "#4": "#4 Buckshot",
  SL: "Slug",
  BR: "Bolt Rack",
  SB: "Standard Bolt",
  EB: "Explosive Bolt",
};

const ShotgunAmmoTypes = new Set([
  "Flechette",
  "#01 Buckshot",
  "#00 Buckshot",
  "#4 Buckshot",
  "Slug",
]);

const BarrelTypes = {
  Factory: [/Factory/, /Default/, /CCN/],
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

class WeaponSheetExporter {
  constructor(name) {
    this.weaponData = {
      name,
      stats: [],
      ammoStats: {},
    };
    this.currentAmmoType = "";
    this.currentBarrelType = "";
    this.seenConfigurations = new Set();
  }

  processRow(values, i, mergedRows) {
    // get ammo type
    const ammoType = values[i][1].toString();
    if (ammoType && ammoType != "x" && ammoType != "CellImage") {
      this.currentAmmoType = this.getAmmoType(ammoType);
    }
    // get barrel type
    const barrelType = values[i][2].toString();
    if (
      barrelType &&
      barrelType != "Comparison Tool" &&
      barrelType != "Barrel (Damage Modifier)"
    ) {
      this.currentBarrelType = this.getBarrelType(barrelType);
    }
    // process ammo stats
    this.processAmmoStats(values, i);
    // if we have both ammo and barrel types, process the row
    if (this.currentBarrelType != "" && this.currentAmmoType != "") {
      this.processStats(values, i, mergedRows);
    }
  }

  processStats(values, i, mergedRows) {
    const startRow = parseInt(i) + 1;
    let endRow = mergedRows[startRow];
    if (!endRow && values[i][5] == "0 ~") {
      // special case for single row dropoff, 0 to infinity
      endRow = startRow;
    }
    if (endRow && this.currentAmmoType != "") {
      const stats = {
        barrelType: this.currentBarrelType,
        ammoType: this.currentAmmoType,
      };
      stats.dropoffs = this.processDropoff(values, startRow - 1, endRow + 1);
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
      const configurationKey = stats.barrelType + stats.ammoType;
      if (!this.seenConfigurations.has(configurationKey)) {
        this.weaponData.stats.push(stats);
        this.seenConfigurations.add(configurationKey);
      } else {
        console.warn(
          "Skipping duplicate configuration for " + configurationKey
        );
      }
    }
  }

  processAmmoStats(values, i) {
    let ammoCountType = values[i][15].toString();
    if (
      ammoCountType &&
      ammoCountType !== "CellImage" &&
      ammoCountType !== "Ammunition"
    ) {
      if (this.weaponData.ammoStats[ammoCountType]) {
        console.warn(
          "skipping duplicate ammo type " +
            this.weaponData.name +
            " " +
            ammoCountType
        );
      } else {
        let shottyOffset = 0;
        let pelletCount;
        if (ShotgunAmmoTypes.has(ammoCountType)) {
          shottyOffset = 1;
          if (ammoCountType == "#00 Buckshot") {
            ammoCountType = "#01 Buckshot";
          }
          pelletCount = matchInt(values[i][16]);
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
        this.weaponData.ammoStats[ammoCountType] = {
          magSize: magSize,
          emptyReload: reload,
          tacticalReload: reloadTactical,
          headshotMultiplier: headshotMultiplier,
          pelletCount: pelletCount,
        };
      }
    }
  }

  getAmmoType(ammoType) {
    for (const key in AmmoTypeMap) {
      if (ammoType.search(key) > -1) {
        const _ammoType = AmmoTypeMap[key];
        // special case for AP ammo
        if (_ammoType == AmmoTypeMap.AP) {
          if (ammoType.search(/BF\/FA/) > -1) {
            return "Armor Piercing (Burst/Auto)";
          } else if (ammoType.search(/SF/) > -1) {
            return "Armor Piercing (Single)";
          }
        }
        return AmmoTypeMap[key];
      }
    }
    return "";
  }

  getBarrelType(barrelType) {
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

  processDropoff(values, startRow, endRow) {
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
