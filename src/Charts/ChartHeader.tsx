import React, { useEffect, useRef, useState } from "react";
import "./ChartHeader.css";

interface ChartHeaderProps {
  title: string;
  description: string;
}

const ChartHeader: React.FC<ChartHeaderProps> = (props) => {
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const mouseY = useRef(0);
  const mouseX = useRef(0);
  const hoverTimeoutId = useRef(0);
  useEffect(() => {
    window.addEventListener("click", (_) => {
      setDescriptionOpen(false);
    });
  }, []);
  let descriptionClass = "chart-description";
  if (descriptionOpen) {
    descriptionClass += " chart-description-open";
  }
  let descriptionStyle = {
    top: mouseY.current - 14,
    left: mouseX.current - 200,
  };
  return (
    <div className="chart-header">
      <span
        onClick={(e) => {
          e.stopPropagation();
          setDescriptionOpen(!descriptionOpen);
        }}
        onMouseLeave={() => {
          console.log("mouse leave");
          clearTimeout(hoverTimeoutId.current);
          setDescriptionOpen(false);
        }}
        onMouseMove={(e) => {
          if (descriptionOpen) return;
          clearTimeout(hoverTimeoutId.current);
          const x = e.clientX;
          const y = e.clientY;
          hoverTimeoutId.current = setTimeout(() => {
            mouseY.current = y;
            mouseX.current = x;
            setDescriptionOpen(true);
          }, 100);
        }}
      >
        <h2 className="chart-title">{props.title}</h2>
        <p
          className={descriptionClass}
          style={descriptionStyle}
          onClick={(e) => e.stopPropagation()}
        >
          {props.description}
        </p>
      </span>
    </div>
  );
};

export default ChartHeader;
