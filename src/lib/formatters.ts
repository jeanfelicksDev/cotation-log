/**
 * Formats an input value according to the branding rules:
 * - Capitalizes the first letter of each word by default.
 * - Allows all-caps words.
 * - Prevents all-lowercase strings.
 */
export const formatInputMask = (val: string): string => {
  if (!val) return "";
  
  // Custom logic: Replace first letter of each word if it's lowercase
  // Using a regex that finds start of string or whitespace followed by a letter
  return val.replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
};
