export const noop = () => {};
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Re-export normalizer utilities
export { normalizeObject, normalizeEmptyStrings, normalizeWithRequiredFields } from "./normalizer";
