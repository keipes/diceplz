import { Chart, TooltipModel } from "chart.js";
import "./CustomTooltip.css";
import { ReactElement, useContext, useState } from "react";
import { ConfigAmmoColor, ConfigHSL } from "../../Util/StringColor";
import { ConfigDisplayName } from "../../Util/LabelMaker";
import { SettingsContext } from "../App";
import { WeaponConfiguration } from "../WeaponConfigurator/WeaponConfigurator";

interface TooltipContext {
  chart: Chart;
  tooltip: TooltipModel<any>;
}

interface TooltipHandler {
  (context: TooltipContext): void;
}

interface TooltipHandlerSetter {
  (handler: TooltipHandler): void;
}

interface TooltipProps {
  setTooltipHandler: TooltipHandlerSetter;
  invertScaleColors: boolean;
}

function useTooltipHandler(): [TooltipHandler, TooltipHandlerSetter] {
  let tooltipHandler: TooltipHandler = (_) => {};
  let registerTooltipHandler: TooltipHandlerSetter = (
    handler: TooltipHandler
  ) => {
    tooltipHandler = handler;
  };
  return [
    (context: TooltipContext) => tooltipHandler(context),
    registerTooltipHandler,
  ];
}

let STICK_LEFT = false; // shared by all charts so tooltips don't flop sides
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
  const [bodyLines, setBodyLines] = useState<string[][]>([]);
  const [titleLines, setTitleLines] = useState<string[]>([]);
  const [precision, setPrecision] = useState(0);
  const settingsContext = useContext(SettingsContext);
  const [maxValue, setMaxValue] = useState(0);
  const [minValue, setMinValue] = useState(Infinity);
  const [ascending, setAscending] = useState(true);
  props.setTooltipHandler((context: TooltipContext) => {
    const { chart, tooltip } = context;
    const styleClone = structuredClone(tooltipStyle);

    if (tooltip.opacity === 0) {
      setTooltipStyle({ ...styleClone, ...{ opacity: 0 } });
    } else {
      if (tooltip.body) {
        let _titleLines = tooltip.title || [];
        if (parseFloat(_titleLines[0]) === chart.scales.x.max) {
          _titleLines[0] += "+";
        }
        let _precision = 0;
        let _maxValue = 0;
        let _minValue = Infinity;
        let _ascending = true;
        const _bodyLines = tooltip.body.map((b) => {
          const [config, value] = b.lines;
          let _value = parseFloat(value);
          if (_value - Math.floor(_value) !== 0) {
            _precision = 2;
          }
          if (_value > _maxValue) {
            _maxValue = _value;
          }
          if (_value < _minValue) {
            _minValue = _value;
          }
          if (_value < _maxValue && _ascending) {
            _ascending = false;
          }
          return [config, value];
        });
        console.log(
          chart.scales.x.max,
          chart.scales.x.min,
          chart.scales.x.ascending
        );
        setMaxValue(chart.scales.y.max);
        setMinValue(chart.scales.y.min);
        setAscending(_ascending);
        setPrecision(_precision);
        setBodyLines(_bodyLines);
        setTitleLines(_titleLines);
        const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas;
        const numColumns = NumColumns(_bodyLines.length);
        const width = COLUMN_WIDTH_PX * numColumns;
        let left = positionX + tooltip.caretX;
        let top = positionY + tooltip.caretY;
        const padding = tooltip.chart.width / 80;
        let offset = padding;
        if (tooltip.caretX + COLUMN_WIDTH_PX + padding > tooltip.chart.width) {
          STICK_LEFT = true;
        } else if (tooltip.caretX - COLUMN_WIDTH_PX - padding < 0) {
          STICK_LEFT = false;
        }
        if (STICK_LEFT) {
          offset = -(COLUMN_WIDTH_PX + padding);
        }
        left = left + offset;
        if (numColumns > 1) {
          left = positionX + chart.width / 2 - width / 2;
        } else {
          top = top - 100;
        }
        setTooltipStyle({
          ...styleClone,
          ...{
            opacity: 1,
            left: left + "px",
            top: top + "px",
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
    let [config, value] = bodyLines[i];
    let bgColor = ConfigHSL(config as unknown as WeaponConfiguration);
    if (settingsContext.useAmmoColorsForGraph) {
      bgColor = ConfigAmmoColor(config as unknown as WeaponConfiguration);
    }
    let score = (parseFloat(value) - minValue) / (maxValue - minValue);
    if (
      (ascending && !props.invertScaleColors) ||
      (!ascending && props.invertScaleColors)
    ) {
      score = 1 - score;
    }
    const valueColor = "hsl(" + score * 120 + ", 50%, 50%)";
    tooltipColumns[column].push(
      <span
        className="tooltipLine"
        key={"key-" + i}
        style={{ backgroundColor: bgColor }}
      >
        <span
          className="tooltipLineValue"
          style={{
            color: valueColor,
          }}
        >
          {parseFloat(value).toFixed(precision)}
        </span>
        <span className="tooltipLineName">
          {ConfigDisplayName(config as unknown as WeaponConfiguration)}
        </span>
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
