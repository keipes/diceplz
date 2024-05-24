


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
    //   min: 0,
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
        autoSkip: false,
      },
    },
  }
};

export { GenerateScales };
