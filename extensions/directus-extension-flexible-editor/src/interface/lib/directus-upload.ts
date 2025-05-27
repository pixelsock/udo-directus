/**
 * Upload a file to Directus and return the file object.
 * @param file File to upload
 * @param metadata Optional metadata (title, folder, etc.)
 * @returns The uploaded Directus file object
 */
export async function uploadToDirectus(file: File, metadata: Record<string, any> = {}) {
  const formData = new FormData();
  Object.entries(metadata).forEach(([key, value]) => {
    formData.append(key, value);
  });
  formData.append('file', file);
  const response = await fetch('/files', {
    method: 'POST',
    body: formData,
    credentials: 'include', // Use session/cookies from Directus admin
  });
  if (!response.ok) {
    throw new Error('Failed to upload file');
  }
  const result = await response.json();
  // Directus returns { data: { ...fileObject } }
  return result.data;
} 