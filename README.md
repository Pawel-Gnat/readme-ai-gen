# Readme AI Generator

how to use:

# pull-request.yml

name: Pull Request

on:
pull_request:
branches: [master]

jobs:
build:
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
