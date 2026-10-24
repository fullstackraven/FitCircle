declare const __FITCIRCLE_BUILD__: { version: string; commit: string };
export const buildInfo = __FITCIRCLE_BUILD__;
export const versionLabel = `Version ${buildInfo.version} (${buildInfo.commit})`;
