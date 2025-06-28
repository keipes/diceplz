import { useEffect, useRef, useState } from 'react';

/**
 * Performance monitoring hook to identify bottlenecks
 */
export const usePerformanceMonitor = (componentName: string) => {
  const renderStartTime = useRef<number>(0);
  
  // Mark render start
  renderStartTime.current = performance.now();
  
  useEffect(() => {
    const renderEndTime = performance.now();
    const renderTime = renderEndTime - renderStartTime.current;
    
    if (renderTime > 16) { // Longer than 1 frame at 60fps
      console.warn(`🐌 Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }
    
    // Log to performance observer if available
    if ('PerformanceObserver' in window) {
      performance.mark(`${componentName}-render-end`);
      performance.measure(
        `${componentName}-render`,
        `${componentName}-render-start`,
        `${componentName}-render-end`
      );
    }
  });
  
  // Mark render start for performance observer
  useEffect(() => {
    if ('PerformanceObserver' in window) {
      performance.mark(`${componentName}-render-start`);
    }
  }, [componentName]);
};

/**
 * Frame rate monitor
 */
export const useFrameRateMonitor = () => {
  const [fps, setFps] = useState(60);
  const lastTime = useRef<number>(performance.now());
  const frameCount = useRef<number>(0);
  
  useEffect(() => {
    let animationFrame: number;
    
    const measureFPS = () => {
      const now = performance.now();
      frameCount.current++;
      
      if (now - lastTime.current >= 1000) { // Every second
        setFps(Math.round((frameCount.current * 1000) / (now - lastTime.current)));
        frameCount.current = 0;
        lastTime.current = now;
      }
      
      animationFrame = requestAnimationFrame(measureFPS);
    };
    
    animationFrame = requestAnimationFrame(measureFPS);
    
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, []);
  
  return fps;
};

/**
 * Memory usage monitor
 */
export const useMemoryMonitor = () => {
  const [memoryInfo, setMemoryInfo] = useState<any>(null);
  
  useEffect(() => {
    const interval = setInterval(() => {
      // @ts-ignore - performance.memory is Chrome-specific
      if (performance.memory) {
        // @ts-ignore
        setMemoryInfo({
          // @ts-ignore
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
          // @ts-ignore
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
          // @ts-ignore
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
        });
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  return memoryInfo;
};

/**
 * Debounced state to reduce rapid updates
 */
export const useDebouncedState = <T>(initialValue: T, delay: number = 300): [T, (value: T) => void] => {
  const [value, setValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const setDebouncedValueWrapper = (newValue: T) => {
    setValue(newValue);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(newValue);
    }, delay);
  };
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return [debouncedValue, setDebouncedValueWrapper];
};

/**
 * Chart data optimization hook
 */
export const useOptimizedChartData = <T>(
  data: T[],
  maxDataPoints: number = 1000
): T[] => {
  return useState(() => {
    if (data.length <= maxDataPoints) {
      return data;
    }
    
    // Sample data points for performance
    const step = Math.ceil(data.length / maxDataPoints);
    return data.filter((_, index) => index % step === 0);
  })[0];
};

/**
 * Aggressive performance settings for Chart.js
 */
export const getHighPerformanceChartOptions = () => ({
  animation: false,
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index' as const,
  },
  hover: {
    animationDuration: 0,
  },
  elements: {
    point: {
      radius: 0, // Remove points entirely for line charts
      hoverRadius: 3,
    },
    line: {
      tension: 0, // No curve smoothing
    },
  },
  scales: {
    x: {
      ticks: {
        maxTicksLimit: 10, // Limit ticks for performance
      },
    },
    y: {
      ticks: {
        maxTicksLimit: 8,
      },
    },
  },
  plugins: {
    legend: {
      display: false, // Disable legend
    },
    tooltip: {
      enabled: true,
      animation: false,
      position: 'nearest' as const,
    },
  },
});
