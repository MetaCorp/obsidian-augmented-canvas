import AugmentedCanvasPlugin from "./AugmentedCanvasPlugin";
import { AugmentedCanvasSettings } from "./settings/AugmentedCanvasSettings";

let settings: AugmentedCanvasSettings | null = null;

export const initLogDebug = (settings2: AugmentedCanvasSettings) => {
	// console.log({ settings2 });
	settings = settings2;
};

// @ts-expect-error
export const logDebug = (...params) => {
	// console.log({ settings })
	settings?.debug && console.log(...params);
};
