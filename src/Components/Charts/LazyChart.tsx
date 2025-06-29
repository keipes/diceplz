import React, { useState, useRef, useEffect } from "react";

interface LazyChartProps {
  children: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
}

/**
 * Lazy loading chart component that only renders when visible
 */
export const LazyChart: React.FC<LazyChartProps> = ({
  children,
  threshold = 0.1,
  rootMargin = "100px",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setHasBeenVisible(true);
        } else {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [threshold, rootMargin]);

  return (
    <div ref={elementRef} style={{ minHeight: "400px" }}>
      {/* Only render if visible or has been visible (to prevent constant mounting/unmounting) */}
      {isVisible || hasBeenVisible ? (
        <div style={{ opacity: isVisible ? 1 : 0.3 }}>{children}</div>
      ) : (
        <div
          style={{
            height: "400px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "8px",
          }}
        >
          <span>Loading chart...</span>
        </div>
      )}
    </div>
  );
};

interface ChartContainerProps {
  children: React.ReactNode;
  maxConcurrentCharts?: number;
}

/**
 * Container that limits the number of actively rendering charts
 */
export const ChartContainer: React.FC<ChartContainerProps> = ({
  children,
  maxConcurrentCharts = 3,
}) => {
  const [visibleCharts, setVisibleCharts] = useState<Set<number>>(new Set());
  const chartRefs = useRef<Map<number, IntersectionObserverEntry>>(new Map());

  const childArray = React.Children.toArray(children);

  useEffect(() => {
    const observers = new Map<number, IntersectionObserver>();

    childArray.forEach((_, index) => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          chartRefs.current.set(index, entry);

          // Get all currently intersecting charts
          const intersecting = Array.from(chartRefs.current.entries())
            .filter(([_, entry]) => entry.isIntersecting)
            .sort((a, b) => b[1].intersectionRatio - a[1].intersectionRatio) // Sort by visibility
            .slice(0, maxConcurrentCharts) // Limit concurrent charts
            .map(([index]) => index);

          setVisibleCharts(new Set(intersecting));
        },
        {
          threshold: [0, 0.1, 0.5, 1],
          rootMargin: "50px",
        }
      );

      observers.set(index, observer);
    });

    // Observe chart containers after render
    const timer = setTimeout(() => {
      observers.forEach((observer, index) => {
        const element = document.querySelector(`[data-chart-index="${index}"]`);
        if (element) {
          observer.observe(element);
        }
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      observers.forEach((observer) => observer.disconnect());
    };
  }, [childArray.length, maxConcurrentCharts]);

  return (
    <>
      {childArray.map((child, index) => (
        <div
          key={index}
          data-chart-index={index}
          style={{ minHeight: "400px" }}
        >
          {visibleCharts.has(index) ? (
            child
          ) : (
            <div
              style={{
                height: "400px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.05)",
                borderRadius: "8px",
                border: "1px dashed rgba(255,255,255,0.2)",
              }}
            >
              <span style={{ opacity: 0.6 }}>
                Chart {index + 1} (Performance Limited)
              </span>
            </div>
          )}
        </div>
      ))}
    </>
  );
};
