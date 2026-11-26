import api from './client.js'

/**
 * GET a file (PDF, CSV) as a Blob, with the file name from Content-Disposition.
 * @returns {Promise<{ blob: Blob, filename: string }>}
 */
export async function fetchFile(url, { params, fallbackName = 'document.pdf' } = {}) {
  const response = await api.get(url, { params, responseType: 'blob' })
  const disposition = response.headers['content-disposition'] ?? ''
  const filename = /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? fallbackName
  return { blob: response.data, filename }
}
