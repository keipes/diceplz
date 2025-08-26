import React from "react";
import {
  Chart,
  ChartConfiguration,
  ChartData,
  ChartOptions,
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
  data?: ChartData;
  options?: ChartOptions;
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

  constructor(props: BaseChartProps) {
    super(props);
    this.canvasRef = React.createRef();
    this.state = {};
  }

  // setRef(ref: React.Ref<BaseChartRef> | null) {
  //   this.chartRef = ref;
  // }

  componentDidMount() {
    this.initializeChart();
    this.updateRef();
  }

  componentDidUpdate(_prevProps: BaseChartProps) {
    this.updateChart();
    this.updateRef();
  }

  componentWillUnmount() {
    this.destroyChart();
  }

  protected updateRef() {
    if (this.props.chartRef) {
      this.props.chartRef.current = this.chart;
    }
  }

  protected initializeChart() {
    if (this.canvasRef.current) {
      const ctx = this.canvasRef.current.getContext("2d");
      if (ctx) {
        // Destroy existing chart if it exists to prevent "canvas already in use" error
        if (this.chart) {
          this.chart.destroy();
          this.chart = null;
        }

        // Additional safety: Check if canvas already has a chart instance
        // Chart.js attaches chart instances to canvas elements
        const canvas = this.canvasRef.current;
        if ((canvas as any).chart) {
          (canvas as any).chart.destroy();
          (canvas as any).chart = null;
        }

        // Even more safety: Use Chart.js registry to find and destroy any existing chart
        const existingChart = Chart.getChart(canvas);
        if (existingChart) {
          existingChart.destroy();
        }

        // Get default config from subclass and merge with user config
        const defaultConfig = this.getDefaultConfig();
        const chartConfig: ChartConfiguration = {
          ...defaultConfig,
          ...this.props.config,
          options: {
            ...defaultConfig.options,
            ...this.props.config.options,
          },
        };

        // Add hover handler if enabled
        if (
          this.props.enableHover &&
          this.props.hoverHandler &&
          this.props.chartRef &&
          this.props.data
        ) {
          if (!chartConfig.options) {
            chartConfig.options = {};
          }

          const existingOnHover = chartConfig.options.onHover;
          chartConfig.options.onHover = (event, chartElement, chart) => {
            // Call the provided hover handler
            this.props.hoverHandler!(
              event,
              chartElement,
              this.props.chartRef!,
              this.props.data!
            );

            // Also call any existing onHover handler
            if (existingOnHover) {
              existingOnHover.call(this.chart, event, chartElement, chart);
            }
          };
        }

        this.chart = new Chart(ctx, chartConfig);
        if (this.props.data) {
          this.updateChart();
        }
        this.updateRef();
      }
    }
  }

  protected updateChart() {
    if (this.chart && this.props.data) {
      this.chart.data = this.props.data;
      if (this.props.options) {
        this.chart.options = this.props.options;
      }
      this.chart.update();
    }
  }

  protected destroyChart() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    // Additional cleanup: ensure canvas is clean
    if (this.canvasRef.current) {
      const canvas = this.canvasRef.current;
      const existingChart = Chart.getChart(canvas);
      if (existingChart) {
        existingChart.destroy();
      }
      // Clear any attached chart reference
      if ((canvas as any).chart) {
        (canvas as any).chart = null;
      }
    }

    this.updateRef();
  }

  // Override this method in subclasses to provide default configuration
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
