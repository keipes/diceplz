import "./TierList.css";
import { GatherTiers } from "./TierSorter";

function TierList() {
  const tiers = GatherTiers(0, 150, 6);
  console.log(tiers);
  const data = [
    { tier: "S", weapons: ["M5A3", "RM68", "AM40", "AK 5C"], tierColor: "red" },
    {
      tier: "A",
      weapons: ["M5A3", "RM68", "AM40", "AK 5C"],
      tierColor: "orange",
    },
    {
      tier: "B",
      weapons: ["M5A3", "RM68", "AM40", "AK 5C"],
      tierColor: "yellow",
    },
    {
      tier: "C",
      weapons: ["M5A3", "RM68", "AM40", "AK 5C"],
      tierColor: "green",
    },
    {
      tier: "D",
      weapons: ["M5A3", "RM68", "AM40", "AK 5C"],
      tierColor: "blue",
    },
    {
      tier: "F",
      weapons: ["M5A3", "RM68", "AM40", "AK 5C"],
      tierColor: "purple",
    },
  ];
  const rows = data.map((tier) => {
    return (
      <div className="tier-list-row" key={tier.tier}>
        <div
          className={
            "tier-list-label tier-list-label-" + tier.tier.toLowerCase()
          }
        >
          {tier.tier}
        </div>
        {tier.weapons.map((weapon) => {
          return (
            <div className="tier-list-item" key={weapon}>
              {weapon}
            </div>
          );
        })}
      </div>
    );
  });
  return <div className="tier-list-container">{rows}</div>;
}

export default TierList;
