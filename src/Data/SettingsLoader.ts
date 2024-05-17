const LOCAL_STORAGE_SETTINGS_KEY = "Settings";

interface BooleanVoidFn {
    (value: boolean): void;
}

interface VoidBooleanFn {
    (): boolean;
}

interface SettingsLoader {
    useAmmoColorsForGraph: VoidBooleanFn,
    setUseAmmoColorsForGraph: BooleanVoidFn,
}

interface Settings {
    useAmmoColorsForGraph: boolean
}

const DEFAULT_SETTINGS: Settings = {
    useAmmoColorsForGraph: false
}

function loadSettingsOrDefault(): Settings {
    let settings: Settings = structuredClone(DEFAULT_SETTINGS);
    const cached = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
    if (cached) {
        const loaded: Settings = JSON.parse(cached);
        if (typeof loaded.useAmmoColorsForGraph == 'boolean') {
            settings.useAmmoColorsForGraph = loaded.useAmmoColorsForGraph
        }
    }
    return settings;
}

function storeSettings(settings: Settings) {
    localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(settings));
}

class LocalStoreSettingsLoader implements SettingsLoader {

    private settings: Settings = loadSettingsOrDefault();

    useAmmoColorsForGraph() {
        return this.settings.useAmmoColorsForGraph;
    }

    setUseAmmoColorsForGraph(value: boolean) {
        // reload settings from disk before modifying, so we don't overwrite something that may have changed in another tab
        const currentSettings = loadSettingsOrDefault();
        currentSettings.useAmmoColorsForGraph = value;
        storeSettings(currentSettings);
        this.settings = currentSettings;
    }
}

function SetUseAmmoColorsForGraph(value: boolean): Settings {
    const currentSettings = loadSettingsOrDefault();
    currentSettings.useAmmoColorsForGraph = value;
    storeSettings(currentSettings);
    return currentSettings;
}

const InitialSettings = loadSettingsOrDefault();
export { LocalStoreSettingsLoader, InitialSettings, SetUseAmmoColorsForGraph };

export type { SettingsLoader, Settings };