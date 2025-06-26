import { Modifiers } from "../../Data/ConfigLoader";
import { ConfiguratorContext } from "../App";
import "./AutoConfigure.css";
import { useContext } from "react";
import { AutoConfigureActions } from "./Optimizers/AutoConfigureActions";
import TTKOptimizerUI from "./TTKOptimizerUI";
import KillsPerMagOptimizerUI from "./KillsPerMagOptimizerUI";
import FilterOptimizerUI from "./FilterOptimizerUI";
import RequirementsOptimizerUI from "./RequirementsOptimizerUI";
import ConfigurationOptimizerUI from "./ConfigurationOptimizerUI";
import KillinessOptimizerUI from "./KillinessOptimizerUI";

interface AutoConfigureProps {
  modifiers: Modifiers;
}

function AutoConfigure(props: AutoConfigureProps) {
  const configurator = useContext(ConfiguratorContext);

  // Create actions handler with optimizer context
  const actions = new AutoConfigureActions({
    configurator,
    modifiers: props.modifiers,
  });

  return (
    <>
      <TTKOptimizerUI actions={actions} />
      <KillsPerMagOptimizerUI actions={actions} />
      <FilterOptimizerUI actions={actions} />
      <RequirementsOptimizerUI actions={actions} />
      <ConfigurationOptimizerUI actions={actions} />
      <KillinessOptimizerUI actions={actions} />
    </>
  );
}

export default AutoConfigure;
