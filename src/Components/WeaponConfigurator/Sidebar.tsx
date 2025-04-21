import "./Sidebar.css";
import Weapon from "./Weapon";
import { useContext } from "react";
import { ConfiguratorContext } from "../App";
import ConfigBar from "./ConfigBar/ConfigBar";
import WeaponTable from "./WeaponTable/WeaponTable";

interface SidebarProps {
  width: number;
  dragging: boolean;
}

function Sidebar(props: SidebarProps) {
  const weapons = [];
  const configurator = useContext(ConfiguratorContext);
  for (const [id, config] of configurator.weaponConfigurations) {
    weapons.push(
      <Weapon id={id} config={config} key={id} weaponConfig={configurator} />
    );
  }
  let sidebarClass = "sidebar";
  let weaponListContainerClass = "sidebar-weapon-list-container";
  if (props.dragging) {
    weaponListContainerClass += " dragging";
  }
  // if (props.dragging && true) {
  //   sidebarClass += " dragging";
  // }
  return (
    <>
      <div className={sidebarClass} style={{ width: props.width + "px" }}>
        <ConfigBar />
        {/* <WeaponTable
          options={["Standard", "Subsonic"]}
          selectedWeapons={["AK5C", "M5A3"]}
        /> */}
        <div className={weaponListContainerClass}>
          <div
            style={{ display: "flex", flexDirection: "row" }}
            className="sidebar-weapon-list"
          >
            {weapons}
          </div>
        </div>
      </div>
    </>
  );
}

// function Weapon() {
//   return (
//     <div className="sidebar-weapon">
//           <div className="sidebar-weapon-titlebar">
//             <div className="sidebar-weapon-name">M5A3</div>
//             <div className="sidebar-weapon-options">Copy Delete Hide</div>
//           </div>
//           <div className="sidebar-weapon-options">
//             <select name="Barrel" id="sidebar-barrel-selector-m5a3">
//               <option value="Factory">Factory</option>
//               <option value="Shortened">Shortened</option>
//             </select>
//             <select name="Barrel" id="sidebar-ammo-selector-m5a3">
//               <option value="Standard">Standard</option>
//               <option value="Subsonic">Subsonic</option>
//             </select>
//           </div>
//         </div>
//   );
// }

export default Sidebar;
