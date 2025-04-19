import "./Sidebar.css";
import Weapon from "./Weapon";
import { useContext } from "react";
import { ConfiguratorContext } from "../App";

interface SidebarProps {
  width: number;
}

function Sidebar(props: SidebarProps) {
  const weapons = [];
  const configurator = useContext(ConfiguratorContext);
  for (const [id, config] of configurator.weaponConfigurations) {
    weapons.push(
      <Weapon id={id} config={config} key={id} weaponConfig={configurator} />
    );
  }
  return (
    <>
      <div className="sidebar" style={{ width: props.width + "px" }}>
        {weapons}
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
