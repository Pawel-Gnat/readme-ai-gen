import { GoogleGenAI } from '@google/genai'
import dotenv from 'dotenv'
import * as fs from 'fs/promises'
import path from 'path'
import { findFilesRecursive } from './helpers'

dotenv.config()

async function main() {
	const googleApiKey = process.env.GOOGLE_API_KEY
	if (!googleApiKey) {
		console.error('GOOGLE_API_KEY is required.')
		process.exit(1)
	}

	// Assume repository root is one level up from src
	const repoRoot = process.env.GITHUB_WORKSPACE

	// Assume README.md is located in the repository root (one level up from src)
	const readmePath = path.join(repoRoot, 'README.md')

	let currentContent = ''
	try {
		currentContent = await fs.readFile(readmePath, 'utf8')
	} catch (err) {
		console.error('Error reading README.md:', err)
		process.exit(1)
	}

	// Define allowed file extensions and excluded directories
	const allowedExtensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.md'])
	const excludedDirs = new Set(['node_modules', '.git', 'dist'])

	const filesFound = await findFilesRecursive(repoRoot, allowedExtensions, excludedDirs)
	const relativeFiles = filesFound.map(filePath => path.relative(repoRoot, filePath))
	const filesListStr = relativeFiles.join('\n')

	// Prepare the prompt for AI to update README.md
	const ai = new GoogleGenAI({ apiKey: googleApiKey })
	const prompt = `
	You are an experienced developer tasked to write documentation for a project.
	Your task is to update the project's README file using raw Markdown syntax (do not wrap it in triple backticks or add "markdown" language specifier). If a README does not exist, create it from scratch using the structured format outlined below. 

	The README should include the following sections with appropriate details drawn from the project:
  	• Tech stack
  	• Getting started
  	• Setup
  	• Running the application

	Additional requirements:
	• Include a proper heading and an overview of the project.
	• Additionally, include a section that lists key repository files (by relative path): ${filesListStr}
	• If there is existing README content, preserve the parts below the updated sections.

	Current README content (if any): ${currentContent}`

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

	if (updatedContent === currentContent) {
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
