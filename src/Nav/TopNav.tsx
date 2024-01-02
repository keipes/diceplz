interface NavProps {

}

function TopNav(props: NavProps) {
    return (
        <>
            <div className="top-nav">

<ul>
  <li><h1 className="top-nav-title">DicePlz</h1></li>
  <li className="top-nav-weapon-select">
    <div className="top-nav-label">SMG</div>
    <div className="weapon-select-dropdown-container">
      <ul className="weapon-select-dropdown">
        <li className="weapon-select-item">PBX-45</li>
        <li className="weapon-select-item">PP-2000</li>
      </ul>
    </div>
  </li>
  <li className="top-nav-weapon-select">
    <div className="top-nav-label">Assault Rifles</div>
    <div className="weapon-select-dropdown-container">
      <ul className="weapon-select-dropdown">
        <li className="weapon-select-item">M5A3</li>
        <li className="weapon-select-item">ACW-R</li>
      </ul>
    </div>
  </li>
</ul>
</div>
        
        </>
    )
}

export default TopNav;