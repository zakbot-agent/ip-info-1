# ip-info

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg) ![License](https://img.shields.io/badge/license-MIT-green.svg) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg)

> CLI tool to get IP address geolocation, ISP, reverse DNS, and WHOIS data

## Features

- CLI tool
- TypeScript support

## Tech Stack

**Runtime:**
- TypeScript v6.0.2

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn

## Installation

```bash
cd ip-info
npm install
```

Or install globally:

```bash
npm install -g ip-info
```

## Usage

### CLI

```bash
ip-info
```

### Available Scripts

| Script | Command |
|--------|---------|
| `npm run build` | `tsc` |
| `npm run start` | `node dist/index.js` |

## Project Structure

```
├── src
│   ├── formatter.ts
│   ├── index.ts
│   ├── lookup.ts
│   ├── public-ip.ts
│   ├── reverse-dns.ts
│   └── whois.ts
├── package.json
├── README.md
└── tsconfig.json
```

## License

This project is licensed under the **MIT** license.

## Author

**Zakaria Kone**
