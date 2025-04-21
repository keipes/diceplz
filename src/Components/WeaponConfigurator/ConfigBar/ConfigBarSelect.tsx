import React from "react";

interface ConfigBarSelectProps {
  options: string[];
  selectedOption: string;
  onOptionChange: (option: string) => void;
}

const ConfigBarSelect: React.FC<ConfigBarSelectProps> = ({
  options,
  selectedOption,
  onOptionChange,
}) => {
  return (
    <select
      value={selectedOption}
      onChange={(e) => onOptionChange(e.target.value)}
      className="config-bar-select"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
};

export default ConfigBarSelect;
