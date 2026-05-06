A small Node.js project for RSS processing and smart web scraping validation.

## Repository structure

- `combied/`
  - `bha-third-eye` package
  - `src/` implementation files for feed processing and unified fetching
  - `env.example` example environment variables for scraping services
- `testing combined/`
  - sample consumer project demonstrating how to use `bha-third-eye`
  - `test.js` example script


This package exports the following functions:

- `processFeeds(options)` — process a list of feeds and return extracted results
- `fetchUnified()` — unified fetch helper for web content

### Dependencies

- `axios`
- `cheerio`
- `dotenv`
- `xml2js`

### Setup

1. Open a terminal inside `combied/`
2. Install packages:
   ```bash
   npm install
   ```
3. Copy environment example:
   ```bash
   cp env.example .env
   ```
4. Fill in values for:
   - `SCRAPINGBEE_API_KEY`
   - `OXYLABS_USERNAME`
   - `OXYLABS_PASSWORD`

## `testing combined` sample

A minimal sample project that imports `bha-third-eye` and runs `processFeeds`.

### Usage

1. Open a terminal inside `testing combined/`
2. Install packages:
   ```bash
   npm install
   ```
3. Run the example:
   ```bash
   node test.js
   ```

`test.js` executes `processFeeds` with two feed URLs and logs the results.

## Notes

- This repository does not currently include a root `package.json`.
- `combied/` is the main package implementation; `testing combined/` is a simple example consumer.
