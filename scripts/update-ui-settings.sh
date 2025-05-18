#!/bin/sh
# Export the current Directus schema to schema.yaml
echo "Exporting current schema..."
npx directus schema snapshot ./database/schema.yaml

echo "\nEdit ./schema.yaml to update UI settings for your fields (e.g., hidden, interface, display, etc.)."
echo "When ready, press enter to apply changes."
read

# Apply the updated schema
echo "Applying updated schema..."
npx directus schema apply ./database/schema.yaml

echo "Done! Your UI settings have been updated."
