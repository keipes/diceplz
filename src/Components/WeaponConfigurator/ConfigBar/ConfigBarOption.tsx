import { useState } from "react";
import "./ConfigBarOption.css";

interface ConfigBarOptionProps {
  label: string;
  onClick: () => void;
}

function ConfigBarOption(props: ConfigBarOptionProps) {
  return (
    <>
      <div className="config-bar-option" onClick={props.onClick}>
        {props.label}
      </div>
    </>
  );
}

export default ConfigBarOption;
