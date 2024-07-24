//@ts-nocheck
function GenerateScales(xAxisLabel: string, yAxisLabel: string, color: string) {
  return {
    y: {
      title: {
        display: yAxisLabel !== "",
        text: yAxisLabel,
        color: color,
      },
      grid: {
        color: "rgba(75, 192, 192, 0.2)",
      },
      // min: 0,
      ticks: {
        color: color,
      },
    },
    x: {
      title: {
        display: xAxisLabel !== "",
        text: xAxisLabel,
        color: color,
      },
      grid: {
        color: "rgba(75, 192, 192, 0.2)",
      },
      min: 0,
      ticks: {
        color: color,
        autoSkip: true,
        callback: function (val: any, index: number): string {
          // if the label can be parsed into an int, only use every 10th label, otherwise just return the label as-is
          // since these are usually just configuration name strings
          const label = this.getLabelForValue(val);
          if (Number.isNaN(parseInt(label))) {
            return label;
          } else {
            return index % 10 === 0 ? label : "";
          }
        },
        // stepSize: 1,
        // min: 0,
        // max: 150,
      },
    },
  };
}

export { GenerateScales };
