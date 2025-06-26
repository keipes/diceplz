import { ReactElement } from "react";
import { AutoConfigureActions } from "./Optimizers/AutoConfigureActions";

interface KillsPerMagOptimizerUIProps {
  actions: AutoConfigureActions;
}

function KillsPerMagOptimizerUI({ actions }: KillsPerMagOptimizerUIProps) {
  const clickClass = "wcf-config-action hover-blue";

  return (
    <Configurer>
      <>
        {"Maximize Kills Per Mag at "}
        <span
          className={clickClass}
          onClick={actions.maximizeKillsPerMagAtRange(0)}
        >
          <>(0m)</>
        </span>
        {", "}
        <span
          className={clickClass}
          onClick={actions.maximizeKillsPerMagAtRange(10)}
        >
          <>(10m)</>
        </span>
        {", "}
        <span
          className={clickClass}
          onClick={actions.maximizeKillsPerMagAtRange(20)}
        >
          <>(20m)</>
        </span>
        {", "}
        <span
          className={clickClass}
          onClick={actions.maximizeKillsPerMagAtRange(30)}
        >
          <>(30m)</>
        </span>
        {", "}
        <span
          className={clickClass}
          onClick={actions.maximizeKillsPerMagAtRange(40)}
        >
          <>(40m)</>
        </span>
        {", "}
        <span
          className={clickClass}
          onClick={actions.maximizeKillsPerMagAtRange(50)}
        >
          <>(50m)</>
        </span>
        {", "}
        <span
          className={clickClass}
          onClick={actions.maximizeKillsPerMagAtRange(75)}
        >
          <>(75m)</>
        </span>
        {", "}
        <span
          className={clickClass}
          onClick={actions.maximizeKillsPerMagAtRange(100)}
        >
          <>(100m)</>
        </span>
        {" or "}
        <span
          className={clickClass}
          onClick={actions.maximizeKillsPerMagAtRange(150)}
        >
          <>(150m)</>
        </span>
        {" range."}
      </>
    </Configurer>
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

export default KillsPerMagOptimizerUI;
