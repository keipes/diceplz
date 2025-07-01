import { ChartConfiguration } from "chart.js";
import { BaseChart, BaseChartProps } from "./BaseChart";

export interface BarChartProps extends BaseChartProps {
  // Additional props specific to bar charts can be added here
}

export class Bar extends BaseChart {
  constructor(props: BarChartProps) {
    super(props);
  }

  protected getDefaultConfig(): Partial<ChartConfiguration> {
    return {
      type: "bar",
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: "category",
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

export default Bar;
