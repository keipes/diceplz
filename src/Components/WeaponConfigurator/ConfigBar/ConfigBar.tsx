import { useState } from "react";
import "./ConfigBar.css";
import ConfigBarOption from "./ConfigBarOption";
import ConfigbarSearch from "./ConfigbarSearch";
import { useContext } from "react";
import { ConfiguratorContext } from "../../App";
import { AddAllConfigurations } from "../../../Data/WeaponConfigurationFunctions";

interface ConfigBarProps {
  width: number;
  dragging: boolean;
}

function ConfigBar(props: ConfigBarProps) {
  const configurator = useContext(ConfiguratorContext);
  const configBarOptions: any[] = [];
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
      label={"Add All Configurations"}
      onClick={() => {
        AddAllConfigurations(configurator);
      }}
      key={configBarOptions.length}
    />
  );
  configBarOptions.push(
    <ConfigBarOption
      label={"Reset Weapon Configurations"}
      onClick={() => {
        // configurator.AutoConfigure();
      }}
      key={configBarOptions.length}
    />
  );
  let configBarClass = "config-bar";
  if (props.dragging) {
    configBarClass += " dragging";
  }
  return (
    <>
      <div
        className={configBarClass}
        style={{
          width: props.width + "px",
        }}
      >
        {/* <ConfigbarSearch /> */}

        {configBarOptions}
      </div>
    </>
  );
}

export default ConfigBar;
