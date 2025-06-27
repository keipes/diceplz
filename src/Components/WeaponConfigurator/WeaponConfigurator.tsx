import "./WeaponConfigurator.css";
import Weapon from "./Weapon";
import { SyntheticEvent, useContext, useState } from "react";

import { ExpandMoreIcon, ExpandLessIcon } from "../Icons";
import AutoConfigure from "./AutoConfigure/AutoConfigure";
import { Modifiers } from "../../Data/ConfigLoader";
import { ConfiguratorContext } from "../App";

interface SetBottomPaddingFn {
  (padding: number): void;
}

interface WeaponConfiguratorProps {
  open: boolean;
  setOpen: SetOpenFn;
  setBottomPadding: SetBottomPaddingFn;
  modifiers: Modifiers;
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
let offset = 0;
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
  const [configOpen, setConfigOpen] = useState(false);
  const configurator = useContext(ConfiguratorContext);
  for (const [id, config] of configurator.weaponConfigurations) {
    weaponsDisplay.push(
      <Weapon id={id} config={config} key={id} weaponConfig={configurator} />
    );
  }
  function toggle() {
    props.setOpen(!props.open);
  }

  let containerClass = "wcf-container";
  const containerStyle = {
    height: height + "px",
  };
  if (!props.open) {
    containerClass = "wcf-container-closed";
    containerStyle.height = "2.2rem";
  }
  let expansionIcon;
  if (props.open) {
    expansionIcon = <ExpandMoreIcon />;
  } else {
    expansionIcon = <ExpandLessIcon />;
  }
  mouseMoveHandler = (e) => {
    if (dragging) {
      const newHeight = window.innerHeight - e.clientY + offset;
      setHeight(newHeight);
      props.setBottomPadding(newHeight * 3);
    }
  };
  mouseUpHandler = (_) => {
    setDragging(false);
  };

  let content;
  if (configOpen) {
    content = <AutoConfigure modifiers={props.modifiers} />;
  } else {
    content = <div className="wcf">{weaponsDisplay}</div>;
  }

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
              offset = height - (window.innerHeight - e.clientY);
              setDragging(true);
            }
          }}
        >
          <span
            onMouseDown={dontDragKids}
            className="configurator-optimize hover-blue"
            onClick={() => {
              setConfigOpen(!configOpen);
            }}
          >
            Auto Configure
          </span>
          <span
            onMouseDown={dontDragKids}
            className="configurator-toggle svg-white svg-hover-blue"
            onClick={toggle}
          >
            {expansionIcon}
          </span>
          <span
            onMouseDown={dontDragKids}
            className="configurator-clear-all hover-red"
            onClick={configurator.Reset.bind(configurator)}
          >
            Clear All
          </span>
        </div>
        <div className="wcf-scrollable">{content}</div>
      </div>
    </>
  );
}

export default WeaponConfigurator;
export type { WeaponConfiguration };
