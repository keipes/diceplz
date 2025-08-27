import React from "react";
import {
  Chart,
  ChartConfiguration,
  ChartData,
  LineController,
  BarController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Filler,
} from "chart.js";

// Register Chart.js components
Chart.register(
  LineController,
  BarController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Filler
);

export interface BaseChartRef {
  chart: Chart | null;
}

export interface BaseChartProps {
  config: ChartConfiguration;
  width?: number;
  height?: number;
  className?: string;
  chartRef?: React.MutableRefObject<Chart | null>;
  enableHover?: boolean;
  hoverHandler?: (
    event: any,
    chartElement: any[],
    chartRef: React.MutableRefObject<Chart | null>,
    chartData: ChartData
  ) => void;
}

export interface BaseChartState {}

export abstract class BaseChart extends React.Component<
  BaseChartProps,
  BaseChartState
> {
  protected chart: Chart | null = null;
  protected canvasRef: React.RefObject<HTMLCanvasElement>;
  protected canvas: HTMLCanvasElement | null = null;

  constructor(props: BaseChartProps) {
    super(props);
    this.canvasRef = React.createRef();
    this.state = {};
  }

  componentDidMount() {
    if (this.canvasRef.current) {
      this.initializeChart(this.canvasRef.current);
    } else {
      console.error("Canvas ref is not set");
    }
  }

  componentDidUpdate(_prevProps: BaseChartProps) {
    this.updateChart();
  }

  componentWillUnmount() {
    this.destroyChart();
  }

  protected updateRef() {
    if (this.props.chartRef) {
      this.props.chartRef.current = this.chart;
    }
  }

  protected initializeChart(canvas: HTMLCanvasElement) {
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const defaultConfig = this.getDefaultConfig();
        const chartConfig: ChartConfiguration = {
          ...defaultConfig,
          ...this.props.config,
          options: {
            ...defaultConfig.options,
            ...this.props.config.options,
          },
        };
        if (
          this.props.enableHover &&
          this.props.hoverHandler &&
          this.props.chartRef
        ) {
          if (!chartConfig.options) {
            chartConfig.options = {};
          }
        }
        this.chart = new Chart(ctx, chartConfig);
        if (this.props.config.data) {
          this.updateChart();
        }
        this.updateRef();
      }
    }
  }

  protected updateChart() {
    if (this.chart && this.props.config && this.props.config.data) {
      this.chart.data = this.props.config.data;
      if (this.props.config.options) {
        this.chart.options = this.props.config.options;
      }
      this.chart.update();
    }
  }

  protected destroyChart() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  protected abstract getDefaultConfig(): Partial<ChartConfiguration>;

  render() {
    return (
      <canvas
        ref={this.canvasRef}
        width={this.props.width}
        height={this.props.height}
        className={this.props.className}
      />
    );
  }
}

export default BaseChart;
