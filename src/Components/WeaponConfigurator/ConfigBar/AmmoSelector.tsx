import React, { useContext, useState } from "react";
import "./AmmoSelector.css";
import ConfigBarCheckboxList, {
  ConfigBarCheckboxListOption,
} from "./ConfigBarCheckboxList.tsx";
import { ConfiguratorContext } from "../../App.tsx";
import {
  BaseAmmoTypes,
  SelectAmmo,
} from "../../../Data/WeaponConfigurationFunctions.ts";

interface AmmoSelectorProps {}

const AmmoSelector: React.FC<AmmoSelectorProps> = (
  {
    //   selectedAmmo,
    //   onAmmoChange,
    //   ammoOptions,
  }
) => {
  const configurator = useContext(ConfiguratorContext);
  const [selectedAmmo, setSelectedAmmo] = useState(new Set<string>());
  let ammoOptions = BaseAmmoTypes(configurator).map((ammoType) => ({
    label: ammoType,
    value: ammoType,
    checked: selectedAmmo.has(ammoType),
  }));
  const onAmmoChange = (value: string, checked: boolean) => {
    const newSelectedAmmo = new Set(selectedAmmo);
    if (checked) {
      console.log("Adding ammo type:", value);
      setSelectedAmmo((prev) => new Set(prev).add(value));
      newSelectedAmmo.add(value);
    } else {
      console.log("Removing ammo type:", value);

      newSelectedAmmo.delete(value);
      setSelectedAmmo((prev) => {
        const newSet = new Set(prev);
        newSet.delete(value);
        return newSet;
      });
    }
    SelectAmmo(configurator, newSelectedAmmo);
  };
  return (
    <div className="ammo-selector">
      <h4>Ammo Selector</h4>
      <ConfigBarCheckboxList options={ammoOptions} onChange={onAmmoChange} />
    </div>
  );
};

export default AmmoSelector;
