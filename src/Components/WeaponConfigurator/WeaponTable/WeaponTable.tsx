import React, { useContext } from "react";
import "./WeaponTable.css";
import { ConfiguratorContext } from "../../App";

interface WeaponTableProps {
  options: string[];
  selectedWeapons: string[];
}

const WeaponTable: React.FC<WeaponTableProps> = ({
  options,
  selectedWeapons,
}) => {
  const configurator = useContext(ConfiguratorContext);
  selectedWeapons = [];
  options = [];
  configurator.ForEach((config) => {
    selectedWeapons.push(config.name);
  });
  return (
    <table>
      <thead>
        <tr>
          <th>Weapons / Options</th>
          {options.map((option, index) => (
            <th key={index} className={"option-header"}>
              {option}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {selectedWeapons.map((weapon, rowIndex) => (
          <tr key={rowIndex}>
            <td>{weapon}</td>
            {options.map((_, colIndex) => (
              <td key={colIndex}>
                {/* Add your logic for displaying data or controls here */}
                <input type="checkbox" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default WeaponTable;
