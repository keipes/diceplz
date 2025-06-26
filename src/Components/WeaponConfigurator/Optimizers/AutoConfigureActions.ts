import { MouseEvent } from "react";
import { OptimizerContext } from "./types";
import { TTKOptimizer } from "./TTKOptimizer";
import { KillsPerMagOptimizer } from "./KillsPerMagOptimizer";
import { FilterOptimizer } from "./FilterOptimizer";
import { ConfigurationOptimizer } from "./ConfigurationOptimizer";
import {
  RequirementsOptimizer,
  BTKRequirements,
  TTKRequirements,
} from "./RequirementsOptimizer";
import { KillinessOptimizer } from "./KillinessOptimizer";

export class AutoConfigureActions {
  private context: OptimizerContext;

  constructor(context: OptimizerContext) {
    this.context = context;
  }

  // TTK optimization actions
  minimizeTTKAtRange = (range: number) => (_: MouseEvent<HTMLElement>) => {
    TTKOptimizer.minimizeTTKAtRange(this.context, range);
  };

  findBestTTKAutomatic = (_: MouseEvent<HTMLElement>) => {
    TTKOptimizer.findBestTTKConfigurations(
      this.context,
      TTKOptimizer.automaticRPMSelector
    );
  };

  findBestTTKSingle = (_: MouseEvent<HTMLElement>) => {
    TTKOptimizer.findBestTTKConfigurations(
      this.context,
      TTKOptimizer.singleFireRPMSelector
    );
  };

  // Kills Per Mag optimization actions
  maximizeKillsPerMagAtRange =
    (range: number) => (_: MouseEvent<HTMLElement>) => {
      KillsPerMagOptimizer.maximizeAtRange(this.context, range);
    };

  // Filter optimization actions
  selectStealthConfigurations = (_: MouseEvent<HTMLElement>) => {
    FilterOptimizer.selectStealthConfigurations(this.context);
  };

  selectHighVelocityConfigurations = (_: MouseEvent<HTMLElement>) => {
    FilterOptimizer.selectHighVelocityConfigurations(this.context);
  };

  filterSubsonicOnly = (_: MouseEvent<HTMLElement>) => {
    FilterOptimizer.filterSubsonicOnly(this.context);
  };

  filterByMagazineCapacity =
    (minCapacity: number = 30) =>
    (_: MouseEvent<HTMLElement>) => {
      FilterOptimizer.filterByMagazineCapacity(this.context, minCapacity);
    };

  maximizeRPMAuto = (_: MouseEvent<HTMLElement>) => {
    FilterOptimizer.maximizeRPM(this.context, "auto");
  };

  maximizeRPMBurst = (_: MouseEvent<HTMLElement>) => {
    FilterOptimizer.maximizeRPM(this.context, "burst");
  };

  maximizeRPMSingle = (_: MouseEvent<HTMLElement>) => {
    FilterOptimizer.maximizeRPM(this.context, "single");
  };

  maximizeVelocity = (_: MouseEvent<HTMLElement>) => {
    FilterOptimizer.maximizeVelocity(this.context);
  };

  maximizeMagazineCapacity = (_: MouseEvent<HTMLElement>) => {
    FilterOptimizer.maximizeMagazineCapacity(this.context);
  };

  // Configuration optimization actions
  addAllConfigurationsForSelected =
    (onlyLargestMag: boolean, ignoreAP: boolean) =>
    (_: MouseEvent<HTMLElement>) => {
      ConfigurationOptimizer.addAllConfigurationsForSelected(
        this.context,
        onlyLargestMag,
        ignoreAP
      );
    };

  removeLowerCapacityDuplicates = (_: MouseEvent<HTMLElement>) => {
    ConfigurationOptimizer.removeLowerCapacityDuplicates(this.context);
  };

  // Requirements optimization actions
  selectWeaponsByBTKRequirement =
    (requirements: BTKRequirements) => (_: MouseEvent<HTMLElement>) => {
      RequirementsOptimizer.selectWeaponsByBTKRequirement(
        this.context,
        requirements
      );
    };

  selectWeaponsByTTKRequirement =
    (requirements: TTKRequirements) => (_: MouseEvent<HTMLElement>) => {
      RequirementsOptimizer.selectWeaponsByTTKRequirement(
        this.context,
        requirements
      );
    };

  // Killiness optimization actions
  filterByKilliness =
    (minRange: number, maxRange: number) => (_: MouseEvent<HTMLElement>) => {
      KillinessOptimizer.filterByKilliness(this.context, minRange, maxRange);
    };

  // Utility method to minimize TTK with custom range (for input field)
  minimizeTTKCustomRange = (range: number) => {
    TTKOptimizer.minimizeTTKAtRange(this.context, range);
  };
}
