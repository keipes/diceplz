import { ReactElement } from "react";
import { AutoConfigureActions } from "./Optimizers/AutoConfigureActions";
import { KillinessOptimizer } from "./Optimizers/KillinessOptimizer";

interface KillinessOptimizerUIProps {
  actions: AutoConfigureActions;
}

function KillinessOptimizerUI({ actions }: KillinessOptimizerUIProps) {
  const clickClass = "wcf-config-action hover-blue";

  const killinessOptions = [];
  for (const [start, end] of KillinessOptimizer.KILLINESS_RANGES) {
    killinessOptions.push(
      <span
        key={`${start}-${end}`}
        className={clickClass}
        onClick={actions.filterByKilliness(start, end)}
      >
        {" "}
        {start}-{end}m{""}
      </span>
    );
  }

  return (
    <Configurer>
      <>
        {"Killiness at ranges: "}
        {killinessOptions}
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

export default KillinessOptimizerUI;
