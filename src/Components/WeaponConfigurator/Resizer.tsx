import { useState } from "react";
import "./Resizer.css";

interface ResizerProps {
  setSidebarWidth: (width: number) => void;
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
            props.setSidebarWidth(e.clientX);
          };
          mouseUpHandler = (_) => {
            mouseMoveHandler = null;
            mouseUpHandler = null;
          };
        }}
      ></div>
    </>
  );
}

export default Resizer;
