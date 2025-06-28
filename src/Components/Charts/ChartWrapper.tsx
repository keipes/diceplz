import React, { memo } from "react";

interface ChartWrapperProps {
  children: React.ReactNode;
  title: string;
  description: string;
}

/**
 * Memoized wrapper for chart components to prevent unnecessary re-renders
 */
export const ChartWrapper = memo<ChartWrapperProps>(
  ({ children, title, description }) => {
    return (
      <div className="chart-outer-container">
        <div className="chart-header">
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <div className="chart-container">{children}</div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for better performance
    return (
      prevProps.title === nextProps.title &&
      prevProps.description === nextProps.description &&
      React.isValidElement(prevProps.children) &&
      React.isValidElement(nextProps.children) &&
      prevProps.children.type === nextProps.children.type
    );
  }
);

ChartWrapper.displayName = "ChartWrapper";
