import React from "react";
import "./ConfigBarCheckboxList.css";

interface ConfigBarCheckboxListOption {
  label: string;
  value: string;
  checked: boolean;
}

interface ConfigBarCheckboxListProps {
  options: ConfigBarCheckboxListOption[];
  onChange: (value: string, checked: boolean) => void;
}

const ConfigBarCheckboxList: React.FC<ConfigBarCheckboxListProps> = ({
  options,
  onChange,
}) => {
  const handleCheckboxChange =
    (value: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(value, event.target.checked);
    };

  return (
    <div className="config-bar-checkbox-list">
      {options.map((option) => (
        <label
          key={option.value}
          //   style={{ display: "block", marginBottom: "8px" }}
          className="config-bar-checkbox-label"
        >
          <input
            type="checkbox"
            className="config-bar-checkbox"
            checked={option.checked}
            onChange={handleCheckboxChange(option.value)}
          />
          {option.label}
        </label>
      ))}
    </div>
  );
};

export type { ConfigBarCheckboxListOption };
export default ConfigBarCheckboxList;
