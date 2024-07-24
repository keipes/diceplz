import { Interaction, InteractionModeFunction, PointElement } from "chart.js";
import { getRelativePosition } from "chart.js/helpers";

declare module "chart.js" {
  interface InteractionModeMap {
    dropoffInteractionMode: InteractionModeFunction;
  }
}

/**
 * Custom interaction mode
 * @function Interaction.modes.dropoffInteractionMode
 * @param {Chart} chart - the chart we are returning items from
 * @param {Event} e - the event we are find things at
 * @param {InteractionOptions} options - options to use
 * @param {boolean} [useFinalPosition] - use final element position (animation target)
 * @return {InteractionItem[]} - items that are found
 */
Interaction.modes.dropoffInteractionMode = function (
  chart,
  e,
  _options,
  _useFinalPosition
) {
  const position = getRelativePosition(e, chart as any);
  const xAxisValue = chart.scales["x"].getValueForPixel(position.x);
  console.log(xAxisValue);
  const items: any = [];
  const metasets = chart.getSortedVisibleDatasetMetas();
  for (let i = 0, ilen = metasets.length; i < ilen; ++i) {
    const { index, data } = metasets[i];
    let dropoffIndex = 0;
    for (let j = 0; j < data.length; ++j) {
      let element = data[j] as PointElement;
      if (element.x > position.x) {
        break;
      }
      dropoffIndex = j;
    }
    items.push({
      element: data[dropoffIndex],
      datasetIndex: index,
      index: dropoffIndex,
    });
  }
  return items;
};

// // Then, to use it...
// new Chart.js(ctx, {
//   type: "line",
//   data: data,
//   options: {
//     interaction: {
//       mode: "myCustomMode",
//     },
//   },
// });
