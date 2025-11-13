import { overviewSettings } from "../models/overviewSettings";

export function settingsValid(settings): settings is overviewSettings {
    return (
        typeof settings === "object" &&
        settings !== null &&
        typeof settings.from === "string" &&
        Array.isArray(settings.properties) &&
        settings.properties.every((item) => typeof item === "string") &&
		(settings.sort === undefined || typeof settings.sort === "string") &&
		(settings.excludeEmpty === undefined || typeof settings.excludeEmpty === "boolean")
    );
}