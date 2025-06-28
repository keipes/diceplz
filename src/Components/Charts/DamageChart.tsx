import { Line } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import {
  GetAmmoStat,
  GetStatsForConfiguration,
  GetWeaponByName,
} from "../../Data/WeaponData.ts";
import { Modifiers } from "../../Data/ConfigLoader.ts";
import ChartHeader from "./ChartHeader.tsx";
import { Settings } from "../../Data/SettingsLoader.ts";
import { ConfiguratorContext, ThemeContext } from "../App.tsx";
import { useContext, useState, useRef, useMemo, memo } from "react";
import {
  GenerateScales,
  ConfigureChartColors,
} from "../../Util/ChartCommon.ts";
import RequiredRanges from "../../Util/RequiredRanges.ts";
import { CustomTooltip, useTooltipHandler } from "./CustomTooltip.tsx";
import { useHoverHighlight, useChartHoverHandler } from "./HoverContext.tsx";
import { ConfigDisplayName } from "../../Util/LabelMaker.ts";

interface DamageChartProps {
  modifiers: Modifiers;
  settings: Settings;
}

function DamageChart(props: DamageChartProps) {
  const theme = useContext(ThemeContext);
  const [tooltipHandler, setTooltipHandler] = useTooltipHandler();
  const [headshot, setHeadshot] = useState(false);
  const { currentElementHoverLabels } = useHoverHighlight();
  const chartHoverHandler = useChartHoverHandler();
  const chartRef = useRef<any>();
  const configurations = useContext(ConfiguratorContext);

  // Memoize required ranges calculation
  const requiredRanges = useMemo(() => {
    return RequiredRanges(configurations.weaponConfigurations, (_, _a) => {
      return 1;
    });
  }, [configurations.weaponConfigurations]);

  // Memoize chart data calculation
  const chartData = useMemo((): ChartData<"line"> => {
    const highestRangeSeen = Math.max(...requiredRanges);
    const datasets = [];

    for (const [_id, config] of configurations.weaponConfigurations) {
      if (!config.visible) continue;
      const stats = GetStatsForConfiguration(config);
      const ammoStat = GetAmmoStat(GetWeaponByName(config.name), stats);
      const headshotMultiplier = headshot
        ? ammoStat?.headshotMultiplier ?? 1
        : 1;
      const data = [];
      let lastDamage = 0;
      let lastRange = 0;
      let range = 0;
      let damage = 0;

      for (let dropoff of stats.dropoffs) {
        range = dropoff.range;
        damage =
          dropoff.damage *
          props.modifiers.damageMultiplier *
          props.modifiers.bodyDamageMultiplier *
          headshotMultiplier;
        damage = Math.round(damage * 100) / 100;
        for (let i = lastRange + 1; i < range; i++) {
          if (requiredRanges.has(i)) {
            data.push(lastDamage);
          } else {
            data.push(lastDamage);
          }
        }
        lastDamage = damage;
        lastRange = range;
        data.push(damage);
      }
      if (damage > 0) {
        for (let i = range + 1; i < highestRangeSeen; i++) {
          if (requiredRanges.has(i)) {
            data.push(damage);
          } else {
            data.push(damage);
          }
        }
        if (range != highestRangeSeen) {
          data.push(damage);
        }
      }
      datasets.push({
        label: config as unknown as string,
        data: data,
        fill: false,
        borderColor: ConfigureChartColors(
          config,
          props.settings,
          currentElementHoverLabels,
          theme.highlightColor
        ),
        tension: 0,
        stepped: false,
        borderWidth: 1.5,
        order: currentElementHoverLabels.has(ConfigDisplayName(config)) ? -1000 : 0,
      });
    }

    const labels = [];
    for (let i = 0; i <= Math.max(...requiredRanges); i++) {
      if (requiredRanges.has(i) || i == Math.max(...requiredRanges)) {
        labels.push(i);
      } else {
        labels.push("");
      }
    }

    return {
      labels: labels,
      datasets: datasets,
    };
  }, [
    configurations.weaponConfigurations,
    props.modifiers,
    props.settings,
    headshot,
    requiredRanges,
    currentElementHoverLabels,
    theme.highlightColor,
  ]);

  // Memoize chart options
  const options = useMemo((): ChartOptions<"line"> => {
    return {
      maintainAspectRatio: false,
      animation: false,
      spanGaps: true,
      interaction: {
        intersect: false,
        mode: "index",
      },
      elements: {
        point: {
          radius: 0,
        },
      },
      plugins: {
        tooltip: {
          enabled: false,
          external: tooltipHandler,
          position: "eventXPositioner",
          itemSort: function (a, b) {
            return (b.raw as number) - (a.raw as number);
          },
          callbacks: {
            label: function (ctx) {
              return [ctx.dataset.label, ctx.parsed.y] as unknown as string;
            },
          },
        },
      },
      scales: GenerateScales("meters", "damage", theme.highlightColor),
      onHover: (event, chartElement) => {
        chartHoverHandler(event, chartElement, chartRef, chartData);
      },
    };
  }, [tooltipHandler, theme.highlightColor, chartHoverHandler, chartData]);
  return (
    <div className="chart-outer-container">
      <ChartHeader
        title="Damage"
        description="Weapon damage changes with distance through a step-function damage drop-off, altering values at distinct ranges instead of a gradual decrease or increase."
      />
      <div>
        <label>
          <input
            type="checkbox"
            checked={headshot}
            onChange={(e) => setHeadshot(e.target.checked)}
          />
          Headshot
        </label>
      </div>
      <div className="chart-container">
        <Line data={chartData} options={options} ref={chartRef} />
        <CustomTooltip
          setTooltipHandler={setTooltipHandler}
          currentHighlightedLabels={currentElementHoverLabels}
        />
      </div>
    </div>
  );
}

export default memo(DamageChart, (prevProps, nextProps) => {
  return (
    prevProps.settings.useAmmoColorsForGraph ===
      nextProps.settings.useAmmoColorsForGraph &&
    JSON.stringify(prevProps.modifiers) === JSON.stringify(nextProps.modifiers)
  );
});
