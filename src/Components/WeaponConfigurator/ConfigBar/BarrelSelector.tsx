import React, { useContext, useState } from "react";
import "./BarrelSelector.css";
import ConfigBarCheckboxList, {
  ConfigBarCheckboxListOption,
} from "./ConfigBarCheckboxList.tsx";
import { ConfiguratorContext } from "../../App.tsx";
import {
  BarrelTypes,
  BaseAmmoTypes,
  SelectAmmo,
  SelectBarrel,
} from "../../../Data/WeaponConfigurationFunctions.ts";

interface BarrelSelectorProps {}

const BarrelSelector: React.FC<BarrelSelectorProps> = (
  {
    //   selectedAmmo,
    //   onAmmoChange,
    //   ammoOptions,
  }
) => {
  const configurator = useContext(ConfiguratorContext);
  const [selectedBarrels, setSelectedBarrels] = useState(new Set<string>());
  let barrelTypes = BarrelTypes(configurator).map((barrelType) => ({
    label: barrelType,
    value: barrelType,
    checked: selectedBarrels.has(barrelType),
  }));
  const onAmmoChange = (value: string, checked: boolean) => {
    const newSelectedBarrel = new Set(selectedBarrels);
    if (checked) {
      console.log("Adding barrel type:", value);
      setSelectedBarrels((prev) => new Set(prev).add(value));
      newSelectedBarrel.add(value);
    } else {
      console.log("Removing barrel type:", value);

      newSelectedBarrel.delete(value);
      setSelectedBarrels((prev) => {
        const newSet = new Set(prev);
        newSet.delete(value);
        return newSet;
      });
    }
    SelectBarrel(configurator, newSelectedBarrel);
  };
  return (
    <div className="barrel-selector">
      <h4>Barrel Selector</h4>
      <ConfigBarCheckboxList options={barrelTypes} onChange={onAmmoChange} />
    </div>
  );
};

export default BarrelSelector;
