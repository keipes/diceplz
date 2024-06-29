declare module "chart.js" {
  interface TooltipPositionerMap {
    myCustomPositioner: TooltipPositionerFunction<ChartType>;
    eventXPositioner: TooltipPositionerFunction<ChartType>;
  }
}
import {
  ActiveElement,
  ChartType,
  Point,
  Tooltip,
  TooltipPositionerFunction,
} from "chart.js";

/**
 * Custom positioner
 * @function Tooltip.positioners.myCustomPositioner
 * @param elements {Chart.Element[]} the tooltip elements
 * @param eventPosition {Point} the position of the event in canvas coordinates
 * @returns {TooltipPosition} the tooltip position
 */
let RIGHT_TOOLTIP = false;
Tooltip.positioners.myCustomPositioner = function (
  _: readonly ActiveElement[],
  eventPosition: Point
) {
  const tooltip = this;
  const padding = tooltip.chart.width / 80;
  let offset = tooltip.width / 2 + padding;
  if (eventPosition.x + tooltip.width + padding > tooltip.chart.width) {
    RIGHT_TOOLTIP = true;
  } else if (eventPosition.x - tooltip.width - padding < 0) {
    RIGHT_TOOLTIP = false;
  }
  if (RIGHT_TOOLTIP) {
    offset = -offset;
  }
  return {
    x: eventPosition.x + offset,
    y: eventPosition.y,
    xAlign: "center",
    yAlign: "center",
  };
};

Tooltip.positioners.eventXPositioner = function (
  _: readonly ActiveElement[],
  eventPosition: Point
) {
  return {
    x: eventPosition.x,
    y: eventPosition.y,
  };
};
