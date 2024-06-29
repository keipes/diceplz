import { Chart, TooltipModel } from "chart.js";
import "./CustomTooltip.css";
import { ReactElement, useContext, useState } from "react";
import { ConfigAmmoColor, ConfigHSL } from "../../Util/StringColor";
import { ConfigDisplayName } from "../../Util/LabelMaker";
import { SettingsContext } from "../App";

interface TooltipContext {
  chart: Chart;
  tooltip: TooltipModel<any>;
}

interface TooltipHandler {
  (context: TooltipContext): void;
}

interface TooltipProps {
  setTooltipHandler: (handler: TooltipHandler) => void;
}

function useTooltipHandler() {
  let tooltipHandler: TooltipHandler = (_) => {};
  let registerTooltipHandler = (handler: TooltipHandler) => {
    tooltipHandler = handler;
  };
  return [
    (context: TooltipContext) => tooltipHandler(context),
    registerTooltipHandler,
  ];
}

const COLUMN_WIDTH_PX = 300;
const COLUMN_ROWS = 20;
function MaxColumns() {
  return Math.max(Math.floor(window.innerWidth / COLUMN_WIDTH_PX), 1);
}
function NumColumns(numLines: number) {
  let n = Math.ceil(numLines / COLUMN_ROWS);
  return Math.min(n, MaxColumns());
}
function NumRows(numLines: number) {
  return Math.ceil(numLines / NumColumns(numLines));
}

function CustomTooltip(props: TooltipProps) {
  const [tooltipStyle, setTooltipStyle] = useState({
    opacity: 0,
  });
  const [bodyLines, setBodyLines] = useState<string[]>([]);
  const [titleLines, setTitleLines] = useState<string[]>([]);
  const [precision, setPrecision] = useState(0);
  const settingsContext = useContext(SettingsContext);
  props.setTooltipHandler((context: TooltipContext) => {
    const { chart, tooltip } = context;
    const styleClone = structuredClone(tooltipStyle);
    if (tooltip.opacity === 0) {
      setTooltipStyle({ ...styleClone, ...{ opacity: 0 } });
    } else {
      if (tooltip.body) {
        const _titleLines = tooltip.title || [];
        let _precision = 0;
        const _bodyLines = tooltip.body.map((b) => {
          const [config, value] = b.lines;
          if (value - Math.floor(value) !== 0) {
            _precision = 2;
          }
          return [config, value];
        });
        setPrecision(_precision);
        setBodyLines(_bodyLines);
        setTitleLines(_titleLines);
        const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas;
        const numColumns = NumColumns(_bodyLines.length);
        const width = COLUMN_WIDTH_PX * numColumns;
        let left = positionX + tooltip.caretX + 4;
        if (numColumns > 1) {
          left = positionX + chart.width / 2 - width / 2;
        }
        setTooltipStyle({
          ...styleClone,
          ...{
            opacity: 1,
            left: left + "px",
            top: positionY + tooltip.caretY + 4 + "px",
            font: tooltip.options.bodyFont.string,
            width: width + "px",
          },
        });
      }
    }
  });
  const tooltipColumns: ReactElement[][] = [];
  let column = 0;
  const numRows = NumRows(bodyLines.length);
  for (let i = 0; i < bodyLines.length; i++) {
    if (i % numRows == 0) {
      column++;
      tooltipColumns[column] = [];
    }
    const [config, value] = bodyLines[i];
    let bgColor = ConfigHSL(config);
    if (settingsContext.useAmmoColorsForGraph) {
      bgColor = ConfigAmmoColor(config);
    }
    tooltipColumns[column].push(
      <span
        className="tooltipLine"
        key={"key-" + i}
        style={{ backgroundColor: bgColor }}
      >
        <span className="tooltipLineValue">
          {parseFloat(value).toFixed(precision)}
        </span>
        <span className="tooltipLineName">{ConfigDisplayName(config)}</span>
      </span>
    );
  }

  const columnElements = tooltipColumns.map((columnLines, i) => {
    return (
      <div
        className="tooltipColumn"
        key={"column-" + i}
        style={{ width: COLUMN_WIDTH_PX + "px" }}
      >
        {columnLines}
      </div>
    );
  });
  return (
    <div style={tooltipStyle} className="tooltip">
      <span className="tooltipTitle">{titleLines} meters</span>
      <span className="tooltipBody">{columnElements}</span>
    </div>
  );
}

export type { TooltipContext, TooltipHandler };
export { CustomTooltip, useTooltipHandler };
