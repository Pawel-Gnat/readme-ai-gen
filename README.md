# AI README Generator

This GitHub Action scans your repository including files such as React, TypeScript, JSX, TSX, Vitest, Playwright and Storybook, automatically generates or updates your project's README file using AI powered by Google GenAI.

This tool is created for small projects. Attempting to use it in monorepo will result in incorrect result.

## Overview

The action analyzes your project's codebase to create comprehensive documentation. If a README does not exist, it generates one from scratch using a predefined structured format. If it does exist, the action updates it while preserving existing content below the updated sections. The generated README includes essential sections such as:

- **Tech stack**: An overview of the technologies used in the project.
- **Key repository files**: A list of key files in the project, which can be useful for developers who are new to the project or as a reference to AI model for future code improvements.
- **Getting started**: Basic requirements and setup instructions.
- **Setup**: Environment configuration and installation guidelines.
- **Running the application**: Commands for development, building, and running the project.

## Prerequisites

- **Google API Key**: A valid Google AI Studio API Key is required to use this action.

### How to obtain a Google API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Enable the _Google AI Studio_ API (or the relevant API for GenAI) for your project.
4. Navigate to **APIs & Services > Credentials**.
5. Click **Create credentials** and select **API key**.
6. Copy the generated API key. (For enhanced security, restrict the key's usage in the API credentials settings.)
7. Store this API key as a secret in your GitHub repository (e.g., under the name `GOOGLE_API_KEY`).
8. Alternatively, quickly obtain and verify your API key via [Google AI Studio](https://aistudio.google.com/) by visiting the [API key page](https://aistudio.google.com/app/apikey).

## Usage

Below is an example workflow that uses this action to update or generate the README file:

```yaml
name: Update README

on:
  pull_request:
    branches:
      - main
    types: [opened, synchronize]
  workflow_dispatch:

permissions:
  contents: write
  pull-requests: write

jobs:
  update_readme:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Use Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - uses: pawel-gnat/readme-ai-gen@main
        with:
          GOOGLE_API_KEY: ${{ secrets.GOOGLE_API_KEY }}

      - name: Create Pull Request
        uses: peter-evans/create-pull-request@v6
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          commit-message: 'chore: Update README with AI Assistant'
          committer: GitHub Action <noreply@github.com>
          author: ${{ github.actor }} <${{ github.actor_id }}+${{ github.actor }}@users.noreply.github.com>
          signoff: false
          branch: chore/ai-readme-update
          delete-branch: true
          title: 'AI Readme Update'
          body: |
            Automated README updates by the AI assistant.
          labels: documentation
```

**Setup:**

- Add your GOOGLE_API_KEY as a repository secret under Settings > Secrets and variables > Actions > Repository secrets.
- Place the workflow YAML file in .github/workflows/.

## Inputs

- `GOOGLE_API_KEY`: The API key for Google AI Studio.
- `FILE_EXTENSIONS`: (Optional) Comma-separated list of file extensions to process. Default is `.js, .jsx, .ts, .tsx, .md`.
- `EXCLUDED_DIRS`: (Optional) Comma-separated list of directories to exclude. Default: `node_modules,.git,dist`.

## How It Works

The action scans your repository for source files (including React, TypeScript, JSX, TSX, Vitest, Playwright, and Storybook files), compiles a list of key files, and passes this information along with any existing README content to the AI model. The AI then generates a structured README based on standardized sections:

- **Tech stack**
- **Key repository files**
- **Getting started**
- **Setup**
- **Running the application**

This ensures your project documentation is both complete and up-to-date.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.
