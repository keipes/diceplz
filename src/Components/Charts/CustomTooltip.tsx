import { Chart, TooltipModel } from "chart.js";
import "./CustomTooltip.css";
import { ReactElement, useContext, useState } from "react";
import { ConfigAmmoColor, ConfigHSL } from "../../Util/StringColor";
import { ConfigDisplayName } from "../../Util/LabelMaker";
import { SettingsContext } from "../App";
import { WeaponConfiguration } from "../WeaponConfigurator/WeaponConfigurator";
import { MinMaxScore } from "../../Util/MinMaxValues";

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
  invertScaleColors?: boolean;
  useTierList?: boolean;
  useChartBoundsForScoring?: boolean;
  decimalPlaces?: number;
  min?: number;
  max?: number;
  scores?: MinMaxScore[];
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
  const [precision, setPrecision] = useState(2);
  const settingsContext = useContext(SettingsContext);
  const [maxValue, setMaxValue] = useState(0);
  const [minValue, setMinValue] = useState(Infinity);
  const [chartMin, setChartMin] = useState(0);
  const [chartMax, setChartMax] = useState(0);
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
        let _precision = 2;
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
        setMaxValue(_maxValue);
        setMinValue(_minValue);
        setChartMax(chart.scales.y.max);
        setChartMin(chart.scales.y.min);
        setAscending(_ascending);
        setPrecision(props.decimalPlaces || _precision);
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
          top = top + 60;
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
    let [min, max] = [minValue, maxValue];
    const range = parseFloat(titleLines[0]);
    if (Number.isNaN(range)) {
      console.warn("No range in title lines", titleLines);
    }
    if (props.scores && props.scores.length > range) {
      [min, max] = [props.scores[range].minScore, props.scores[range].maxScore];
      // if (range === 0) {
      //   console.log("min", min, "max", max, "value", value, "config", config);
      // }
      // console.log("min", min, "max", max, "value", value, "config", config);
    } else if (props.min !== undefined && props.max !== undefined) {
      [min, max] = [props.min, props.max];
      console.warn("used min max from props");
    } else {
      console.warn("No min max in props", props);
    }
    let scoreRange = max - min;
    let score: number = (parseFloat(value) - min) / (max - min);
    if (
      (ascending && !props.invertScaleColors) ||
      (!ascending && props.invertScaleColors)
    ) {
      score = 1 - score;
    }
    const grades = [
      ["F", 0.2, 1],
      ["D", 0.4, 0.8],
      ["C", 0.6, 0.6],
      ["B", 0.8, 0.4],
      ["A", 0.9, 0.2],
      ["S", Infinity, 0],
    ];
    if (props.useTierList) {
      score = 1 - score;
      // score = parseFloat(value);
      // if (score < 1) {
      //   console.log(
      //     "score",
      //     score,
      //     "value",
      //     value,
      //     "config",
      //     config,
      //     "min",
      //     min,
      //     "max",
      //     max,
      //     "range",
      //     range
      //   );
      // }
      for (const [grade, threshold, tierListColorScore] of grades) {
        if (score <= (threshold as number) * 1) {
          value = grade as string;
          score = tierListColorScore as number;
          break;
        }
      }
    } else {
      value = parseFloat(value).toFixed(
        props.decimalPlaces === undefined ? precision : props.decimalPlaces
      );
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
          {value}
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
