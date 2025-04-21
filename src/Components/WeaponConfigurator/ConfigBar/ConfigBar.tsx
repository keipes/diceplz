import "./ConfigBar.css";
import ConfigBarOption from "./ConfigBarOption";
import ConfigBarSelect from "./ConfigBarSelect";
import ConfigBarCheckboxList from "./ConfigBarCheckboxList";
import { useContext } from "react";
import { ConfiguratorContext } from "../../App";
import {
  AddAllConfigurations,
  AmmoTypes,
  ResetWeaponConfigurations,
  SelectAmmo,
} from "../../../Data/WeaponConfigurationFunctions";
import { BaseAmmoType } from "../../../Data/WeaponData";
import AmmoSelector from "./AmmoSelector";

interface ConfigBarProps {
  // width: number;
  // dragging: boolean;
}

function ConfigBar(_props: ConfigBarProps) {
  const configurator = useContext(ConfiguratorContext);
  const configBarOptions: any[] = [];

  if (configurator.weaponConfigurations.size > 0) {
    configBarOptions.push(
      <ConfigBarOption
        label={"All Configurations"}
        onClick={() => {
          AddAllConfigurations(configurator);
        }}
        key={configBarOptions.length}
      />
    );
    configBarOptions.push(
      <ConfigBarOption
        label={"Reset Configurations"}
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
    configBarOptions.push(
      <ConfigBarSelect
        label={"Weapon"}
        options={ammoTypesArray}
        onOptionChange={(value) => {
          // const currentWeapons: any[] = [];
          // configurator.weaponConfigurations.forEach((config) => {
          //   currentWeapons.push(config.name);
          // });
          // configurator.SelectWeapons((weapon) => {
          //   return weapon.name === value;
          // });
          SelectAmmo(configurator, value);
        }}
        key={configBarOptions.length}
      />
    );
    // const ammoTypeOptions: any[] = [];
    // for (const ammoType of ammoTypesArray) {
    //   ammoTypeOptions.push({
    //     label: ammoType,
    //     value: ammoType,
    //     checked: false,
    //   });
    // }
    // const ammoTypeOptionsArray = Array.from(ammoTypeOptions);

    // configBarOptions.push(
    //   <ConfigBarCheckboxList
    //     label={"Select Options"}
    //     options={ammoTypeOptionsArray}
    //     onChange={(option, checked) => {
    //       console.log("Option: ", option, " Checked: ", checked);
    //     }}
    //     key={configBarOptions.length}
    //   />
    // );

    configBarOptions.push(<AmmoSelector key={configBarOptions.length} />);
    // configBarOptions.push(
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
