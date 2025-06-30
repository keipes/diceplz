import React from "react";
import { Chart, ChartConfiguration, ChartData, ChartOptions } from "chart.js";

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

export class BaseChart extends React.Component<BaseChartProps, BaseChartState> {
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

  componentDidUpdate(prevProps: BaseChartProps) {
    if (
      this.chart &&
      (prevProps.data !== this.props.data ||
        prevProps.options !== this.props.options)
    ) {
      this.updateChart();
    }
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
        // Clone the config to avoid mutating the original
        const chartConfig = { ...this.props.config };

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
      this.updateRef();
    }
  }

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
