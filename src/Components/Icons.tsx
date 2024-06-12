import React from "react";

import contentCopySvg from "../assets/icons/content_copy_FILL0_wght400_GRAD0_opsz24.svg";
import visibilitySvg from "../assets/icons/visibility_FILL0_wght400_GRAD0_opsz24.svg";
import visibilityOffSvg from "../assets/icons/visibility_off_FILL0_wght400_GRAD0_opsz24.svg";
import deleteSvg from "../assets/icons/delete_FILL0_wght400_GRAD0_opsz24.svg";
import settingsSvg from "../assets/icons/settings_FILL0_wght400_GRAD0_opsz24.svg";
import infoSvg from "../assets/icons/info_FILL0_wght400_GRAD0_opsz24.svg";
import expandMoreSvg from "../assets/icons/expand_more_FILL0_wght400_GRAD0_opsz24.svg";
import expandLessSvg from "../assets/icons/expand_less_FILL0_wght400_GRAD0_opsz24.svg";
import discordMarkWhiteSvg from "../assets/icons/discord-mark-white.svg";
import discordMarkBlackSvg from "../assets/icons/discord-mark-black.svg";
import discordMarkBlueSvg from "../assets/icons/discord-mark-blue.svg";
import googleSheetsLogoPng from "../assets/icons/Google_Sheets_logo_(2014-2020).svg.png";
interface IconProps {
  alt?: string;
}

export const ContentCopyIcon: React.FC<IconProps> = (props) => (
  <img src={contentCopySvg} alt={props.alt || "Content Copy Icon"} />
);
export const VisibilityIcon: React.FC<IconProps> = (props) => (
  <img src={visibilitySvg} alt={props.alt || "Visibility Icon"} />
);
export const VisibilityOffIcon: React.FC<IconProps> = (props) => (
  <img src={visibilityOffSvg} alt={props.alt || "Visibility Off Icon"} />
);
export const DeleteIcon: React.FC<IconProps> = (props) => (
  <img src={deleteSvg} alt={props.alt || "Delete Icon"} />
);
export const SettingsIcon: React.FC<IconProps> = (props) => (
  <img src={settingsSvg} alt={props.alt || "Settings Icon"} />
);
export const InfoIcon: React.FC<IconProps> = (props) => (
  <img src={infoSvg} alt={props.alt || "Info Icon"} />
);
export const ExpandMoreIcon: React.FC<IconProps> = (props) => (
  <img src={expandMoreSvg} alt={props.alt || "Expand"} />
);
export const ExpandLessIcon: React.FC<IconProps> = (props) => (
  <img src={expandLessSvg} alt={props.alt || "Collapse"} />
);
export const DiscordMarkWhite: React.FC<IconProps> = (props) => (
  <img src={discordMarkWhiteSvg} alt={props.alt || "Discord Mark"} />
);
export const DiscordMarkBlack: React.FC<IconProps> = (props) => (
  <img src={discordMarkBlackSvg} alt={props.alt || "Discord Mark"} />
);
export const DiscordMarkBlue: React.FC<IconProps> = (props) => (
  <img src={discordMarkBlueSvg} alt={props.alt || "Discord Mark"} />
);
export const GoogleSheetsLogo: React.FC<IconProps> = (props) => (
  <img src={googleSheetsLogoPng} alt={props.alt || "Google Sheets Logo"} />
);
