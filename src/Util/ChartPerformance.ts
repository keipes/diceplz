/**
 * Common Chart.js optimizations for better performance
 */
export const PERFORMANCE_OPTIMIZATIONS = {
  // Disable animations for better performance
  animation: false,

  // Optimize responsiveness
  responsive: true,
  maintainAspectRatio: false,

  // Optimize interactions
  interaction: {
    intersect: false,
    mode: "index" as const,
  },

  // Optimize hover behavior
  hover: {
    animationDuration: 0,
  },

  // Optimize elements for performance
  elements: {
    point: {
      hoverRadius: 6,
      radius: 3,
    },
    line: {
      tension: 0, // Disable bezier curves for better performance
    },
  },
} as const;

/**
 * Optimized dataset configurations
 */
export const OPTIMIZED_DATASET_CONFIG = {
  // Reduce point radius for better performance with large datasets
  pointRadius: 2,
  pointHoverRadius: 4,

  // Optimize border width
  borderWidth: 2,

  // Disable point background color for performance
  pointBackgroundColor: "transparent",

  // Optimize line rendering
  fill: false,
  spanGaps: false,
} as const;
