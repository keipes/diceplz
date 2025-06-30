import { Chart, ChartConfiguration } from "chart.js";
import { BaseChartClass, BaseChartProps } from "./BaseChart";

export interface LineChartProps extends BaseChartProps {
  // Additional props specific to line charts can be added here
}

export class Line extends BaseChartClass {
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
            display: true,
          },
        },
      },
    };
  }

  protected initializeChart() {
    if (this.canvasRef.current) {
      const ctx = this.canvasRef.current.getContext("2d");
      if (ctx) {
        const defaultConfig = this.getDefaultConfig();
        const mergedConfig: ChartConfiguration = {
          ...defaultConfig,
          ...this.props.config,
          options: {
            ...defaultConfig.options,
            ...this.props.config.options,
          },
        };

        this.chart = new Chart(ctx, mergedConfig);
        if (this.props.data) {
          this.updateChart();
        }
        this.updateRef();
      }
    }
  }
}
