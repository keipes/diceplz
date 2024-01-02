import './WeaponConfigurator.css'
import { WeaponSelections } from './App';
import Weapon from './WeaponConfigurator/Weapon';


interface WeaponConfiguratorProps {
    // selectedWeapons: Map<string, WeaponSelections>,
    // setSelectedWeapons: Function,
    configurations: Map<String, WeaponConfiguration>
}

interface WeaponConfiguration {
    name: string,
    visible: boolean,
    barrelType: string,
    ammoType: string
}

function WeaponConfigurator(props: WeaponConfiguratorProps) {
    let mockWeapons = [];
    for (const [id, config] of props.configurations) {
        mockWeapons.push(config);
    }
    const weaponsDisplay = [];
    for (const weaponConfig of mockWeapons) {
        console.log(weaponConfig.name);
        weaponsDisplay.push(<Weapon config={weaponConfig}/>);
    }
  return (
    <>
    <div className="wcf-container">
        <div className="wcf-header">
            <span className="material-symbols-outlined">expand_more</span>
        </div>

        <div className="wcf">
        
            {weaponsDisplay}
            
        </div>
    </div>
    </>
  )
}

// function configurationDisplay(config: WeaponConfiguration) {
//     return (
//         // <div className="wcf-weapon">
//         //     <div className="wcf-name">{config.name}</div>
//         //     <button><span class="material-symbols-outlined">close</span></button>
//         //     <button><span class="material-symbols-outlined">visibility</span></button>
//         //     <button><span class="material-symbols-outlined">visibility_off</span></button>
//         //     <button><span class="material-symbols-outlined">content_copy</span></button>
//         // </div>
//         <Weapon config={config}/>
//     );
// }

export default WeaponConfigurator
export type {
    WeaponConfiguration
}
