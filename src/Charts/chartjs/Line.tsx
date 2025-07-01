import { ChartConfiguration } from "chart.js";
import { BaseChart, BaseChartProps } from "./BaseChart";

export interface LineChartProps extends BaseChartProps {
  // Additional props specific to line charts can be added here
}

export class Line extends BaseChart {
  constructor(props: LineChartProps) {
    super(props);
  }

  protected getDefaultConfig(): Partial<ChartConfiguration> {
    return {
      type: "line",
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: "linear",
            position: "bottom",
          },
          y: {
            beginAtZero: true,
          },
        },
        plugins: {
          legend: {
            display: false,
          },
        },
      },
    };
  }
}

export default Line;
