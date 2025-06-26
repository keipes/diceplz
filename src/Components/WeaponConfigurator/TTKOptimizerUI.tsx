import { ReactElement, useState } from "react";
import { AutoConfigureActions } from "./Optimizers/AutoConfigureActions";

interface TTKOptimizerUIProps {
  actions: AutoConfigureActions;
}

function TTKOptimizerUI({ actions }: TTKOptimizerUIProps) {
  const clickClass = "wcf-config-action hover-blue";
  const [ttkInputRange, setTTKInputRange] = useState(30);

  return (
    <>
      <Configurer>
        <>
          {"Minimize TTK at "}
          <span className={clickClass} onClick={actions.minimizeTTKAtRange(0)}>
            <>(0m)</>
          </span>
          {", "}
          <span className={clickClass} onClick={actions.minimizeTTKAtRange(10)}>
            <>(10m)</>
          </span>
          {", "}
          <span className={clickClass} onClick={actions.minimizeTTKAtRange(20)}>
            <>(20m)</>
          </span>
          {", "}
          <span className={clickClass} onClick={actions.minimizeTTKAtRange(30)}>
            <>(30m)</>
          </span>
          {", "}
          <span className={clickClass} onClick={actions.minimizeTTKAtRange(40)}>
            <>(40m)</>
          </span>
          {", "}
          <span className={clickClass} onClick={actions.minimizeTTKAtRange(50)}>
            <>(50m)</>
          </span>
          {", "}
          <span className={clickClass} onClick={actions.minimizeTTKAtRange(75)}>
            <>(75m)</>
          </span>
          {", "}
          <span
            className={clickClass}
            onClick={actions.minimizeTTKAtRange(100)}
          >
            <>(100m)</>
          </span>
          {" or "}
          <span
            className={clickClass}
            onClick={actions.minimizeTTKAtRange(150)}
          >
            <>(150m)</>
          </span>
          {" range."}
        </>
      </Configurer>

      <Configurer>
        <>
          <span
            className={clickClass}
            onClick={() => actions.minimizeTTKCustomRange(ttkInputRange)}
          >
            {"Minimize TTK at "}
          </span>
          <input
            type="number"
            value={ttkInputRange}
            onChange={(e) => {
              const newRange = parseFloat(e.target.value);
              setTTKInputRange(newRange);
              actions.minimizeTTKCustomRange(newRange);
            }}
            min={0}
            max={150}
            step={1}
          />
          {" meters."}
        </>
      </Configurer>

      <Configurer>
        <>
          <span className={clickClass} onClick={actions.findBestTTKAutomatic}>
            {
              "Select configurations for the current weapons which are within 110% of the lowest ttk of current weapons at some range. (Automatic Fire)"
            }
          </span>
        </>
      </Configurer>

      <Configurer>
        <>
          <span className={clickClass} onClick={actions.findBestTTKSingle}>
            {
              "Select configurations for the current weapons which are within 110% of the lowest ttk of current weapons at some range. (Single Fire)"
            }
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

export default TTKOptimizerUI;
