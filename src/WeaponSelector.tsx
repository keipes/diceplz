import "./WeaponSelector.css";
import weaponData from "./assets/weapons.json";
import WeaponCategory from "./WeaponCategory";
import { WeaponSelections } from "./App";

interface WeaponSelectorProps {
  selectedWeapons: Map<string, WeaponSelections>;
  setSelectedWeapons: Function;
}

function WeaponSelector(props: WeaponSelectorProps) {
  let categories = [];
  for (const category of Object.keys(weaponData)) {
    categories.push(
      <WeaponCategory
        title={category}
        key={category}
        selectedWeapons={props.selectedWeapons}
        setSelectedWeapons={props.setSelectedWeapons}
      />
    );
  }
  return (
    <>
      {categories}
      {/* <WeaponCategory title="Sidearms"/>
        <WeaponCategory title="SMG"/>
        <WeaponCategory title="Assault"/>
        <WeaponCategory title="LMG"/>
        <WeaponCategory title="DMR"/>
        <WeaponCategory title="Bolt Action"/>
        <WeaponCategory title="Other"/> */}
    </>
  );
}

export default WeaponSelector;
