import { ReactElement, useState } from "react";
import { WeaponCategories } from "../../Data/WeaponData";
import { AutoConfigureActions } from "./Optimizers/AutoConfigureActions";

interface RequirementsOptimizerUIProps {
  actions: AutoConfigureActions;
}

function RequirementsOptimizerUI({ actions }: RequirementsOptimizerUIProps) {
  const clickClass = "wcf-config-action hover-blue";

  // BTK Requirements state
  const [requiredBTK, setRequiredBTK] = useState(4);
  const [requiredBTKRange, setRequiredBTKRange] = useState(30);
  const [requiredBTKWeaponCategory, setRequiredBTKWeaponCategory] = useState(
    WeaponCategories[2]
  );
  const [requiredBTKNumHeadshots, setRequiredBTKNumHeadshots] = useState(0);

  // TTK Requirements state
  const [requiredTTK, setRequiredTTK] = useState(300);
  const [requiredTTKRange, setRequiredTTKRange] = useState(30);
  const [requiredTTKWeaponCategory, setRequiredTTKWeaponCategory] = useState(
    WeaponCategories[2]
  );
  const [requiredTTKNumHeadshots, setRequiredTTKNumHeadshots] = useState(0);

  return (
    <>
      <Configurer>
        <>
          <span
            className={clickClass}
            onClick={actions.selectWeaponsByBTKRequirement({
              maxBTK: requiredBTK,
              range: requiredBTKRange,
              weaponCategory: requiredBTKWeaponCategory,
              numHeadshots: requiredBTKNumHeadshots,
            })}
          >
            {"Select all weapons with BTK <= "}
          </span>
          <input
            type="number"
            value={requiredBTK}
            onChange={(e) => setRequiredBTK(parseFloat(e.target.value))}
            min={1}
            max={10}
            step={1}
          />
          {" at "}
          <input
            type="number"
            value={requiredBTKRange}
            onChange={(e) => setRequiredBTKRange(parseFloat(e.target.value))}
            min={0}
            max={150}
            step={1}
          />
          {"m in "}
          <select
            value={requiredBTKWeaponCategory}
            onChange={(e) => setRequiredBTKWeaponCategory(e.target.value)}
          >
            {WeaponCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {" with "}
          <input
            type="number"
            value={requiredBTKNumHeadshots}
            onChange={(e) =>
              setRequiredBTKNumHeadshots(parseFloat(e.target.value))
            }
            min={0}
            step={1}
          />
          {" headshots."}
        </>
      </Configurer>

      <Configurer>
        <>
          <span
            className={clickClass}
            onClick={actions.selectWeaponsByTTKRequirement({
              maxTTK: requiredTTK,
              range: requiredTTKRange,
              weaponCategory: requiredTTKWeaponCategory,
              numHeadshots: requiredTTKNumHeadshots,
            })}
          >
            {"Select all weapons with TTK <= "}
          </span>
          <input
            type="number"
            value={requiredTTK}
            onChange={(e) => setRequiredTTK(parseFloat(e.target.value))}
            min={0}
            max={10000}
            step={1}
          />
          {" at "}
          <input
            type="number"
            value={requiredTTKRange}
            onChange={(e) => setRequiredTTKRange(parseFloat(e.target.value))}
            min={0}
            max={150}
            step={1}
          />
          {"m in "}
          <select
            value={requiredTTKWeaponCategory}
            onChange={(e) => setRequiredTTKWeaponCategory(e.target.value)}
          >
            {WeaponCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {" with "}
          <input
            type="number"
            value={requiredTTKNumHeadshots}
            onChange={(e) =>
              setRequiredTTKNumHeadshots(parseFloat(e.target.value))
            }
            min={0}
            step={1}
          />
          {" headshots"}
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

export default RequirementsOptimizerUI;
