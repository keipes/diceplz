import { ReactElement, useState } from "react";
import { AutoConfigureActions } from "./Optimizers/AutoConfigureActions";

interface ConfigurationOptimizerUIProps {
  actions: AutoConfigureActions;
}

function ConfigurationOptimizerUI({ actions }: ConfigurationOptimizerUIProps) {
  const clickClass = "wcf-config-action hover-blue";

  const [allConfigsOnlyLargestMag, setAllConfigsOnlyLargestMag] =
    useState(true);
  const [allConfigsIgnoreAP, setAllConfigsIgnoreAP] = useState(true);

  return (
    <>
      <Configurer>
        <>
          <span
            className={clickClass}
            onClick={actions.addAllConfigurationsForSelected(
              allConfigsOnlyLargestMag,
              allConfigsIgnoreAP
            )}
          >
            {"Add all configurations for currently selected weapons. "}
          </span>

          <label style={{ userSelect: "none" }}>
            <input
              type="checkbox"
              checked={allConfigsOnlyLargestMag}
              onChange={(e) => setAllConfigsOnlyLargestMag(e.target.checked)}
            />
            {"Ignore Smaller Mags For Same Ammo Type"}
          </label>
          <label style={{ userSelect: "none" }}>
            <input
              type="checkbox"
              checked={allConfigsIgnoreAP}
              onChange={(e) => setAllConfigsIgnoreAP(e.target.checked)}
            />
            {"Ignore AP"}
          </label>
        </>
      </Configurer>

      <Configurer>
        <>
          <span
            className={clickClass}
            onClick={actions.removeLowerCapacityDuplicates}
          >
            {"Remove lower capacity ammo types if stats match."}
          </span>
        </>
      </Configurer>
    </>
  );
}

interface ConfigurerProps {
  children: ReactElement;
}

function Configurer(props: ConfigurerProps) {
  return (
    <>
      <div>{props.children}</div>
    </>
  );
}

export default ConfigurationOptimizerUI;
