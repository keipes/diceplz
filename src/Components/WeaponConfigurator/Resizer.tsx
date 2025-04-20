import { useState } from "react";
import "./Resizer.css";

interface ResizerProps {
  setSidebarWidth: (width: number) => void;
  rightHandSide: boolean;
  setDragging: (isDragging: boolean) => void;
}

interface MouseEventHandler {
  (e: MouseEvent): void;
}
// assign mousemove and mouseup handlers to window, so
// dragging can continue even if the mouse leaves the
// configurator
let mouseMoveHandler: MouseEventHandler | null = null;
window.addEventListener("mousemove", (e) => {
  if (mouseMoveHandler) {
    mouseMoveHandler(e);
  }
});

let mouseUpHandler: MouseEventHandler | null = null;
window.addEventListener("mouseup", (e) => {
  if (mouseUpHandler) {
    mouseUpHandler(e);
  }
});

function Resizer(props: ResizerProps) {
  return (
    <>
      <div
        className="resizer"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          mouseMoveHandler = (e) => {
            if (props.rightHandSide) {
              props.setSidebarWidth(window.innerWidth - e.clientX);
            } else {
              props.setSidebarWidth(e.clientX);
            }
            props.setDragging(true);
          };
          mouseUpHandler = (_) => {
            mouseMoveHandler = null;
            mouseUpHandler = null;
            props.setDragging(false);
          };
        }}
      ></div>
    </>
  );
}

export default Resizer;
