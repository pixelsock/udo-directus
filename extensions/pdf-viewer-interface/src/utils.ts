// Simple utility functions to replace @directus-labs/utils

/**
 * Constructs an asset URL from a file ID
 * @param fileID The ID of the file to get the asset URL for
 * @param baseURL Optional base URL, defaults to empty string
 * @returns The full asset URL
 */
export function getAssetUrl(fileID: string, baseURL: string = ''): string {
  if (!fileID) return '';
  return `${baseURL}/assets/${fileID}`;
}