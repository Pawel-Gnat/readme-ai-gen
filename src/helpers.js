import * as fs from 'fs/promises'
import path from 'path'

/**
 * Recursively finds files in a directory matching allowed extensions, excluding specified directories.
 * @param {string} dir - The starting directory.
 * @param {Set<string>} allowedExtensions - Set of allowed file extensions.
 * @param {Set<string>} excludedDirs - Set of directory names to exclude.
 * @returns {Promise<string[]>} - List of matching file paths.
 */

export async function findFilesRecursive(dir, allowedExtensions, excludedDirs) {
	let filesFound = []
	try {
		const entries = await fs.readdir(dir, { withFileTypes: true })
		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name)
			if (excludedDirs.has(entry.name)) {
				continue
			}
			if (entry.isDirectory()) {
				filesFound = filesFound.concat(await findFilesRecursive(fullPath, allowedExtensions, excludedDirs))
			} else if (entry.isFile()) {
				const ext = path.extname(entry.name)
				if (allowedExtensions.has(ext)) {
					filesFound.push(fullPath)
				}
			}
		}
	} catch (error) {
		console.warn(`Could not read directory ${dir}: ${error.message}`)
	}
	return filesFound
}
