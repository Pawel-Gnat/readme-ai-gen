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

/**
 * Reads the content of README.md file.
 * @param {string} repoRoot - The root directory of the repository.
 * @returns {Promise<string>} - The content of README.md file.
 */
export async function getReadmeContent(repoRoot) {
	// Assume README.md is located in the repository root (one level up from src)
	const readmePath = path.join(repoRoot, 'README.md')
	let currentContent = ''

	try {
		currentContent = await fs.readFile(readmePath, 'utf8')
	} catch (err) {
		if (err.code === 'ENOENT') {
			console.log('README.md not found - will create a new one.')
			currentContent = ''
		} else {
			console.error('Error reading README.md:', err)
			process.exit(1)
		}
	}

	return currentContent
}

/**
 * Reads the content of package.json file.
 * @param {string} repoRoot - The root directory of the repository.
 * @returns {Promise<string>} - The content of package.json file.
 */
export async function getPackageJson(repoRoot) {
	// Assume package.json is located in the repository root (one level up from src)
	const packageJsonPath = path.join(repoRoot, 'package.json')

	try {
		const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8')
		return packageJsonContent
	} catch (err) {
		console.error('Error reading package.json:', err)
		process.exit(1)
	}
}

/**
 * Reads the content of snippets from the given file paths.
 * @param {string[]} filePaths - The paths of the files to read.
 * @param {number} maxLines - The maximum number of lines to read from each file.
 * @returns {Promise<{path: string, snippet: string}[]}> - The snippets.
 */
export async function getSnippets(filePaths, maxLines = 20) {
	const snippets = []
	for (const p of filePaths.slice(0, 20)) {
		const content = await fs.readFile(p, 'utf8')
		const lines = content.split('\n').slice(0, maxLines).join('\n')
		snippets.push({ path: path.relative(repoRoot, p), snippet: lines })
	}
	return snippets
}
