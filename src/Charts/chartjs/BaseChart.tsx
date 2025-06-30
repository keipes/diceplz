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
}

export interface BaseChartState {}

export class BaseChartClass extends React.Component<
  BaseChartProps,
  BaseChartState
> {
  protected chart: Chart | null = null;
  protected canvasRef: React.RefObject<HTMLCanvasElement>;
  private chartRef: React.Ref<BaseChartRef> | null = null;

  constructor(props: BaseChartProps) {
    super(props);
    this.canvasRef = React.createRef();
    this.state = {};
  }

  setRef(ref: React.Ref<BaseChartRef> | null) {
    this.chartRef = ref;
  }

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
    if (this.chartRef && typeof this.chartRef === "function") {
      this.chartRef({ chart: this.chart });
    } else if (this.chartRef && "current" in this.chartRef) {
      (this.chartRef as React.MutableRefObject<BaseChartRef>).current = {
        chart: this.chart,
      };
    }
  }

  protected initializeChart() {
    if (this.canvasRef.current) {
      const ctx = this.canvasRef.current.getContext("2d");
      if (ctx) {
        this.chart = new Chart(ctx, this.props.config);
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

export const BaseChart = React.forwardRef<BaseChartRef, BaseChartProps>(
  (props, ref) => {
    const chartInstance = React.useRef<BaseChartClass>(null);

    React.useEffect(() => {
      if (chartInstance.current) {
        chartInstance.current.setRef(ref);
      }
    }, [ref]);

    return <BaseChartClass ref={chartInstance} {...props} />;
  }
);
