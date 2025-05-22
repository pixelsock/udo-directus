# DirectusUDO 2025

A Content Management System for Urban Development Ordinances based on Directus.

## Overview

This project is a customized Directus instance designed to manage and serve Urban Development Ordinance (UDO) content. It includes several custom extensions to enhance functionality for working with PDF documents and other UDO-specific features.

## Key Features

- PDF extraction and processing capabilities
- Custom theme for UDO management
- Google Docs integration
- PDF viewing interface
- Document conversion utilities

## Custom Extensions

- **llama-pdf-extract**: PDF text extraction using pdf-parse
- **google-to-html**: Google Docs conversion utility
- **pdf-viewer-interface**: Interface for viewing PDFs
- **pdf-to-html-interface**: Interface for converting PDFs to HTML
- **UDO Theme**: Custom theme for the Directus admin interface

## Getting Started

1. Clone this repository
2. Install dependencies with `npm install`
3. Configure your environment variables
4. Run the Directus instance with `npm run dev`

## Requirements

- Node.js 16+
- PostgreSQL or SQLite database

## License

This project is licensed under the MIT License.