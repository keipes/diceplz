import React, { useEffect, useState } from "react";
import "./ChartHeader.css";

interface ChartHeaderProps {
  title: string;
  description: string;
}

const ChartHeader: React.FC<ChartHeaderProps> = (props) => {
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  useEffect(() => {
    window.addEventListener("click", (_) => {
      setDescriptionOpen(false);
    });
  }, []);
  let descriptionClass = "chart-description";
  if (descriptionOpen) {
    descriptionClass += " chart-description-open";
  }
  return (
    <div className="chart-header">
      <h2
        className="chart-title"
        onClick={(e) => {
          e.stopPropagation();
          setDescriptionOpen(!descriptionOpen);
        }}
      >
        {props.title}
      </h2>
      <p className={descriptionClass} onClick={(e) => e.stopPropagation()}>
        {props.description}
      </p>
    </div>
  );
};

export default ChartHeader;
