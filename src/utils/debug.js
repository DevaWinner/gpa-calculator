// Debug utility - only logs in development mode
const isDebugMode = import.meta.env.VITE_DEBUG_MODE === "true";

export const debugLog = (...args) => {
	if (isDebugMode) {
		console.log(...args);
	}
};

export const debugWarn = (...args) => {
	if (isDebugMode) {
		console.warn(...args);
	}
};

export const debugError = (...args) => {
	if (isDebugMode) {
		console.error(...args);
	}
};
