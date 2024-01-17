import "./WeaponConfigurator.css";
import { WeaponConfig } from "../App";
import Weapon from "./Weapon";
import { SyntheticEvent, useState } from "react";

import expandMoreSvg from "../icons/expand_more_FILL0_wght400_GRAD0_opsz24.svg";
import expandLessSvg from "../icons/expand_less_FILL0_wght400_GRAD0_opsz24.svg";

interface SetBottomPaddingFn {
  (padding: number): void;
}

interface WeaponConfiguratorProps {
  configurations: Map<string, WeaponConfiguration>;
  weaponConfig: WeaponConfig;
  open: boolean;
  setOpen: SetOpenFn;
  setBottomPadding: SetBottomPaddingFn;
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
  let expansionSource = expandMoreSvg;
  const containerStyle = {
    height: height + "px",
  };
  if (!props.open) {
    expansionSource = expandLessSvg;
    containerClass = "wcf-container-closed";
    containerStyle.height = "2.2rem";
  }
  mouseMoveHandler = (e) => {
    if (dragging) {
      const newHeight = window.innerHeight - e.clientY;
      setHeight(newHeight);
      props.setBottomPadding(newHeight);
    }
  };
  mouseUpHandler = (_) => {
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
            if (props.open) {
              setDragging(true);
            }
          }}
        >
          <span></span>
          <span
            onMouseDown={dontDragKids}
            className="configurator-toggle svg-white svg-hover-blue"
          >
            <img onClick={toggle} src={expansionSource} />
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
