import { GoogleGenAI } from '@google/genai'
import dotenv from 'dotenv'
import * as fs from 'fs/promises'
import path from 'path'
import { findFilesRecursive, getPackageJson, getReadmeContent, getSnippets } from './helpers'

dotenv.config()

async function main() {
	const googleApiKey = process.env.GOOGLE_API_KEY
	if (!googleApiKey) {
		console.error('GOOGLE_API_KEY is required.')
		process.exit(1)
	}

	// Assume repository root is one level up from src
	const repoRoot = process.env.GITHUB_WORKSPACE

	// Define allowed file extensions and excluded directories
	const allowedExtensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.md'])
	const excludedDirs = new Set(['node_modules', '.git', 'dist'])

	const filesFound = await findFilesRecursive(repoRoot, allowedExtensions, excludedDirs)
	const relativeFiles = filesFound.map(filePath => path.relative(repoRoot, filePath))
	const filesListStr = relativeFiles.join('\n')
	const packageJson = await getPackageJson(repoRoot)
	const currentReadmeContent = await getReadmeContent(repoRoot)
	const shortCodeSnippets = await getSnippets(relativeFiles, repoRoot)

	// Prepare the prompt for AI to update README.md
	const ai = new GoogleGenAI({ apiKey: googleApiKey })
	const prompt = `
	### ROLE
	You are a senior JavaScript developer and expert technical writer.

	### CONTEXT
	Repository file list: ${filesListStr}
	Package.json file: ${packageJson}
	README.md file, if exists: ${currentReadmeContent}
	Short code snippets: ${shortCodeSnippets.map(snippet => `- ${snippet.path}\n${snippet.snippet}`).join('\n')}

	### TASK
	Create or update README.md in raw Markdown only (no code fences).
	Follow exactly the outline below and replace angle-bracket placeholders <> with real content.

	### OUTLINE
	# <Project Title>

	## Overview
	<2-4 sentence project summary>

	## Tech Stack
	<List main technologies/frameworks inferred from file extensions and package.json>

	## Key Repository Files
	- \`path/file1.js\` - <1-line purpose>
	- \`path/file2.tsx\` - <1-line purpose>

	## Getting Started
	<clone, install>

	## Setup
	<env vars, config>

	## Running the application
	<dev server, prod build, tests>

	### RULES
	* Keep section order exactly as in OUTLINE.
	* If a detail is unknown, write “TBD”.
	* If README.md exists, preserve the parts below the updated sections.
	* If README.md exists, follow the existing format and structure.
	* Output must be valid Markdown - no additional commentary.
	* Do not include any additional commentary or explanation.
	`

	console.log('Generating updated README content via AI...')
	let response
	try {
		response = await ai.models.generateContent({
			model: 'gemini-2.0-flash',
			contents: prompt,
		})
	} catch (error) {
		console.error('Error generating updated README content:', error)
		process.exit(1)
	}

	const updatedContent = response.text
	if (!updatedContent || updatedContent.trim() === '') {
		console.warn('AI did not return any content. Aborting update.')
		process.exit(1)
	}

	if (updatedContent === currentReadmeContent) {
		console.log('README.md is already up-to-date. No changes made.')
	} else {
		try {
			await fs.writeFile(readmePath, updatedContent, 'utf8')
			console.log('README.md has been successfully updated by script.')
		} catch (err) {
			if (err.code !== 'ENOENT') {
				console.error('Error reading README.md:', err)
				process.exit(1)
			}
		}
	}
}

main().catch(err => {
	console.error('Update process failed:', err)
	process.exit(1)
})
