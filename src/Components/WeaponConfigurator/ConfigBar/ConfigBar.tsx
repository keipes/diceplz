import "./ConfigBar.css";
import ConfigBarOption from "./ConfigBarOption";
import ConfigBarSelect from "./ConfigBarSelect";
import ConfigBarCheckboxList from "./ConfigBarCheckboxList";
import { useContext, useState } from "react";
import { ConfiguratorContext } from "../../App";
import {
  AddAllConfigurations,
  AmmoTypes,
  ResetWeaponConfigurations,
  SelectAmmo,
  SelectMatching,
  SelectMatchingConfigsMatcher,
} from "../../../Data/WeaponConfigurationFunctions";
import { BaseAmmoType } from "../../../Data/WeaponData";
import AmmoSelector from "./AmmoSelector";
import BarrelSelector from "./BarrelSelector";

interface ConfigBarProps {
  // width: number;
  // dragging: boolean;
}

export interface SetSelectMatchingConfigsMatcher {
  (configMatcher: SelectMatchingConfigsMatcher): void;
}

function ConfigBar(_props: ConfigBarProps) {
  const configurator = useContext(ConfiguratorContext);
  const configBarOptions: any[] = [];
  const defaultFilter: SelectMatchingConfigsMatcher = {};
  const [configMatcher, setConfigMatcher] = useState(defaultFilter);
  // SelectMatching(configurator, configMatcher);
  if (configurator.weaponConfigurations.size > 0 || true) {
    configBarOptions.push(
      <ConfigBarOption
        label={"All Wpn Configs"}
        onClick={() => {
          AddAllConfigurations(configurator);
        }}
        key={configBarOptions.length}
      />
    );
    configBarOptions.push(
      <ConfigBarOption
        label={"Default Wpn Configs"}
        onClick={() => {
          // configurator.AutoConfigure();
          ResetWeaponConfigurations(configurator);
        }}
        key={configBarOptions.length}
      />
    );
    configBarOptions.push(
      <ConfigBarOption
        label={"Clear All"}
        onClick={() => {
          configurator.Reset();
        }}
        key={configBarOptions.length}
      />
    );
    configBarOptions.push(
      <ConfigBarOption
        label={"Dedupe"}
        onClick={() => {
          configurator.Dedupe();
        }}
        key={configBarOptions.length}
      />
    );
    const ammoTypes = new Set<string>();
    AmmoTypes(configurator).forEach((ammoType) => {
      ammoTypes.add(BaseAmmoType(ammoType));
    });
    const ammoTypesArray = Array.from(ammoTypes);
    ammoTypesArray.sort((a, b) => {
      if (a < b) {
        return -1;
      }
      if (a > b) {
        return 1;
      }
      return 0;
    });
    // configBarOptions.push(
    //   <ConfigBarSelect
    //     label={"Weapon"}
    //     options={ammoTypesArray}
    //     onOptionChange={(value) => {
    //       SelectAmmo(configurator, value);
    //     }}
    //     key={configBarOptions.length}
    //   />
    // );
    configBarOptions.push(
      <BarrelSelector
        key={configBarOptions.length}
        configMatcher={configMatcher}
        setConfigMatcher={setConfigMatcher}
      />
    );

    configBarOptions.push(
      <AmmoSelector
        key={configBarOptions.length}
        configMatcher={configMatcher}
        setConfigMatcher={setConfigMatcher}
      />
    );
  }

  let configBarClass = "config-bar";
  // if (props.dragging) {
  //   configBarClass += " dragging";
  // }
  return (
    <>
      <div
        className={configBarClass}
        // style={{
        //   width: props.width + "px",
        // }}
      >
        {/* <ConfigbarSearch /> */}
        {configBarOptions}
      </div>
    </>
  );
}

export default ConfigBar;
