import "./WeaponConfigurator.css";
import { WeaponConfig } from "../App";
import Weapon from "./Weapon";
import { SyntheticEvent, useState } from "react";

interface WeaponConfiguratorProps {
  configurations: Map<string, WeaponConfiguration>;
  weaponConfig: WeaponConfig;
  open: boolean;
  setOpen: SetOpenFn;
}

interface SetOpenFn {
  (visible: boolean): void;
}

interface WeaponConfiguration {
  name: string;
  visible: boolean;
  barrelType: string;
  ammoType: string;
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

function WeaponConfigurator(props: WeaponConfiguratorProps) {
  const weaponsDisplay = [];
  const [dragging, setDragging] = useState(false);
  const [height, setHeight] = useState(window.innerHeight / 3);
  for (const [id, config] of props.configurations) {
    weaponsDisplay.push(
      <Weapon
        id={id}
        config={config}
        key={id}
        weaponConfig={props.weaponConfig}
      />
    );
  }
  function toggle() {
    props.setOpen(!props.open);
  }

  let containerClass = "wcf-container";
  let expansionSymbol = "expand_more";
  const containerStyle = {
    height: height + "px",
  };
  if (!props.open) {
    expansionSymbol = "expand_less";
    containerClass = "wcf-container-closed";
    containerStyle.height = "2.2rem";
  }
  mouseMoveHandler = (e) => {
    if (dragging) {
      // e.preventDefault();
      // e.stopPropagation();
      const newHeight = window.innerHeight - e.clientY;
      setHeight(newHeight);
    }
  };
  mouseUpHandler = (_) => {
    // e.preventDefault();
    // e.stopPropagation();
    setDragging(false);
  };
  const dontDragKids = (e: SyntheticEvent) => e.stopPropagation();
  return (
    <>
      <div style={containerStyle} className={containerClass}>
        <div
          className="wcf-header-bar"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragging(true);
          }}
        >
          <span></span>
          <span onMouseDown={dontDragKids} className="configurator-toggle">
            <span className=" material-symbols-outlined" onClick={toggle}>
              {expansionSymbol}
            </span>
          </span>
          <span
            onMouseDown={dontDragKids}
            className="configurator-clear-all"
            onClick={props.weaponConfig.Reset}
          >
            Clear All
          </span>
        </div>
        <div className="wcf-scrollable">
          <div className="wcf">{weaponsDisplay}</div>
        </div>
      </div>
    </>
  );
}

export default WeaponConfigurator;
export type { WeaponConfiguration };
