import { ReactElement } from "react";
import { AutoConfigureActions } from "./Optimizers/AutoConfigureActions";

interface FilterOptimizerUIProps {
  actions: AutoConfigureActions;
}

function FilterOptimizerUI({ actions }: FilterOptimizerUIProps) {
  const clickClass = "wcf-config-action hover-blue";

  return (
    <>
      <Configurer>
        <>
          <span
            className={clickClass}
            onClick={actions.selectStealthConfigurations}
          >
            {
              "Stealthify (select all suppressed+subsonic configurations for selected weapons, remove weapon if no stealth option exists)."
            }
          </span>
        </>
      </Configurer>

      <Configurer>
        <>
          <span
            className={clickClass}
            onClick={actions.selectHighVelocityConfigurations}
          >
            {"Add all velocity > 1000ms configurations."}
          </span>
        </>
      </Configurer>

      <Configurer>
        <>
          <span className={clickClass} onClick={actions.filterSubsonicOnly}>
            {"Select subsonic ammo from current configurations."}
          </span>
        </>
      </Configurer>

      <Configurer>
        <>
          {"Maximize RPM "}
          <span className={clickClass} onClick={actions.maximizeRPMAuto}>
            {"(Auto)"}
          </span>
          {", "}
          <span className={clickClass} onClick={actions.maximizeRPMBurst}>
            {"(Burst)"}
          </span>
          {", "}
          <span className={clickClass} onClick={actions.maximizeRPMSingle}>
            {"(Single)"}
          </span>
        </>
      </Configurer>

      <Configurer>
        <>
          <span className={clickClass} onClick={actions.maximizeVelocity}>
            {"Maximize Velocity"}
          </span>
        </>
      </Configurer>

      <Configurer>
        <>
          <span
            className={clickClass}
            onClick={actions.maximizeMagazineCapacity}
          >
            {"Maximize Magazine Capacity"}
          </span>
        </>
      </Configurer>

      <Configurer>
        <>
          <span
            className={clickClass}
            onClick={actions.filterByMagazineCapacity(30)}
          >
            {"Filter Mag Capacity >= 30"}
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

export default FilterOptimizerUI;
