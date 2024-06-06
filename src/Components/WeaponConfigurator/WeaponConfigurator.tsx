import "./WeaponConfigurator.css";
import { StatScorer, WeaponConfig } from "../App";
import Weapon from "./Weapon";
import { SyntheticEvent, useState } from "react";

import { ExpandMoreIcon, ExpandLessIcon } from "../Icons";
import { TTK } from "../../Util/Conversions";
import AutoConfigure from "./AutoConfigure";

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
let range = 0;

function WeaponConfigurator(props: WeaponConfiguratorProps) {
  const weaponsDisplay = [];
  const [dragging, setDragging] = useState(false);
  const [height, setHeight] = useState(window.innerHeight / 3);
  const [configOpen, setConfigOpen] = useState(false);

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
      props.setBottomPadding(newHeight);
    }
  };
  mouseUpHandler = (_) => {
    setDragging(false);
  };

  const ttkMaximizer: StatScorer = (config, stat) => {
    let damage = 0;
    for (let i = 0; i < stat.dropoffs.length; i++) {
      if (stat.dropoffs[i].range > range) {
        break;
      }
      damage = stat.dropoffs[i].damage;
    }
    return -TTK(
      config,
      {
        healthMultiplier: 1,
        damageMultiplier: 1,
        bodyDamageMultiplier: 1,
      },
      damage,
      stat.rpmAuto ? stat.rpmAuto : 0
    );
  };

  let content;
  if (configOpen) {
    content = (<AutoConfigure/>)
  } else {
    content = (<div className="wcf">{weaponsDisplay}</div>);
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
              // console.log(range);
              // props.weaponConfig.Maximize(ttkMaximizer);
              setConfigOpen(!configOpen);
              // range = range + 10;
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
            onClick={props.weaponConfig.Reset}
          >
            Clear All
          </span>
        </div>
        <div className="wcf-scrollable">
          {content}
        </div>
      </div>
    </>
  );
}

export default WeaponConfigurator;
export type { WeaponConfiguration };
