/**
 * Cross-platform file download utility
 * Handles file downloads on web (blob URLs) and mobile (Capacitor Filesystem + Share)
 */

import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { isNative } from './platform';
import { logger } from './logger';

/**
 * Download a text file (JSON, CSV, etc.)
 * Works on both web and native mobile platforms
 *
 * @param content - File content as string
 * @param filename - Output filename with extension
 * @param mimeType - MIME type (e.g., 'application/json', 'text/csv')
 */
export async function downloadTextFile(
  content: string,
  filename: string,
  mimeType: string
): Promise<void> {
  if (isNative()) {
    await downloadTextFileNative(content, filename, mimeType);
  } else {
    downloadTextFileWeb(content, filename, mimeType);
  }
}

/**
 * Download a blob file on web browser
 */
function downloadTextFileWeb(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  // Cleanup
  URL.revokeObjectURL(url);
}

/**
 * Download a text file on native mobile using Capacitor Filesystem + Share
 * Note: mimeType parameter is not used in native implementation as Share API handles it automatically
 */
async function downloadTextFileNative(
  content: string,
  filename: string,
  _mimeType: string // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<void> {
  try {
    // Write file to cache directory (temporary storage)
    const result = await Filesystem.writeFile({
      path: filename,
      data: content,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });

    logger.info('Download', 'File written to cache:', result.uri);

    // Share the file (this allows user to save it or share it)
    await Share.share({
      title: `Compartir ${filename}`,
      text: `Exportar ${filename}`,
      url: result.uri,
      dialogTitle: 'Guardar archivo',
    });

    logger.info('Download', 'File shared successfully');
  } catch (error) {
    logger.error('Download', 'Failed to download file on native:', error);
    throw new Error(`Error al exportar archivo: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Download a JSON object as a file
 * @param data - Object to serialize as JSON
 * @param filename - Output filename (without extension)
 */
export async function downloadJSON(data: unknown, filename: string): Promise<void> {
  const content = JSON.stringify(data, null, 2);
  await downloadTextFile(content, `${filename}.json`, 'application/json');
}

/**
 * Download a CSV file
 * @param content - CSV content as string
 * @param filename - Output filename (without extension)
 */
export async function downloadCSV(content: string, filename: string): Promise<void> {
  // Add UTF-8 BOM for Excel compatibility
  const bom = '\uFEFF';
  await downloadTextFile(bom + content, `${filename}.csv`, 'text/csv;charset=utf-8;');
}
