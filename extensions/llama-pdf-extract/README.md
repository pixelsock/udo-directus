# Llama PDF Extract Extension

This Directus extension exposes an endpoint for parsing PDF files with the
`llama-extract` library. The parsed content can then be used as the body of a
Directus article.

The `/extract` route accepts a `multipart/form-data` request containing a `file`
field with the PDF. The response returns the extracted HTML.

The actual integration with `llama-extract` is left as a TODO. Replace the
placeholder implementation in `src/index.ts` with real logic once the library is
available in this environment.
