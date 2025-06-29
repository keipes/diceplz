import React, { createContext, useContext, useState, useCallback } from "react";
import { ConfigDisplayName } from "../../Util/LabelMaker";
import type { ChartData } from "chart.js";

// Throttle function to limit hover event frequency
function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastExecTime = 0;

  return (...args: Parameters<T>) => {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}

interface HoverHighlightContextType {
  currentElementHoverLabels: Set<string>;
  setCurrentElementHoverLabels: (labels: Set<string>) => void;
}

const HoverHighlightContext = createContext<HoverHighlightContextType | null>(
  null
);

export const HoverHighlightProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [currentElementHoverLabels, setCurrentElementHoverLabels] = useState(
    new Set<string>()
  );

  return (
    <HoverHighlightContext.Provider
      value={{ currentElementHoverLabels, setCurrentElementHoverLabels }}
    >
      {children}
    </HoverHighlightContext.Provider>
  );
};

export const useHoverHighlight = () => {
  const context = useContext(HoverHighlightContext);
  if (!context) {
    throw new Error(
      "useHoverHighlight must be used within a HoverHighlightProvider"
    );
  }
  return context;
};

export const useChartHoverHandler = () => {
  const { setCurrentElementHoverLabels } = useHoverHighlight();

  // Create a throttled version of the hover handler
  const throttledHandler = useCallback(
    throttle(
      (
        event: any,
        chartElement: any[],
        chartRef: any,
        chartData: ChartData<"line">
      ) => {
        if (chartElement.length > 0 && chartRef.current) {
          const chartValueForMouseY =
            chartRef.current.scales.y.getValueForPixel(event.y);

          // Find the element(s) with the closest y value to chartValueForMouseY
          let closestDistance = Infinity;
          const closestElements: typeof chartElement = [];

          for (const element of chartElement) {
            // Access the element's parsed data through the chart
            const chart = chartRef.current;
            const datasetIndex = element.datasetIndex;
            const index = element.index;

            if (chart && chart.data.datasets[datasetIndex]) {
              const dataset = chart.data.datasets[datasetIndex];
              const dataPoint = dataset.data[index];

              if (typeof dataPoint === "number") {
                const distance = Math.abs(dataPoint - chartValueForMouseY);

                if (distance < closestDistance) {
                  closestDistance = distance;
                  closestElements.length = 0; // Clear array
                  closestElements.push(element);
                } else if (distance === closestDistance) {
                  closestElements.push(element);
                }
              }
            }
          }

          setCurrentElementHoverLabels(
            new Set(
              closestElements.map((el) =>
                ConfigDisplayName(
                  chartData.datasets[el.datasetIndex].label as any
                )
              )
            )
          );
        } else {
          setCurrentElementHoverLabels(new Set());
        }
      },
      16
    ), // Throttle to ~60fps
    [setCurrentElementHoverLabels]
  );

  return throttledHandler;
};

export const useBarChartHoverHandler = () => {
  const { setCurrentElementHoverLabels } = useHoverHighlight();

  // Create a throttled version of the bar chart hover handler
  const throttledHandler = useCallback(
    throttle(
      (
        _event: any,
        chartElement: any[],
        chartRef: any,
        chartData: ChartData<"bar">
      ) => {
        if (chartElement.length > 0 && chartRef.current) {
          // For bar charts, we want to highlight based on the X-axis position (which weapon)
          // Get the index of the x-axis item being hovered
          const hoveredIndex = chartElement[0].index;

          // Get the label at this x-axis position (the weapon name)
          const hoveredLabel = chartData.labels?.[hoveredIndex];

          if (hoveredLabel) {
            setCurrentElementHoverLabels(new Set([hoveredLabel as string]));
          } else {
            setCurrentElementHoverLabels(new Set());
          }
        } else {
          setCurrentElementHoverLabels(new Set());
        }
      },
      16
    ), // Throttle to ~60fps
    [setCurrentElementHoverLabels]
  );

  return throttledHandler;
};
