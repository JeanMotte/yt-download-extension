#!/bin/bash

# 1. Set up variables
echo "Setting up variables..."
OPENAPI_FILE="api/openapi.json"
OUTPUT_DIR="src/api"
TEMP_DIR="temp_api"

# 2. Clean up previous generation (with sudo to handle permissions)
echo "Cleaning up previous generation..."
sudo rm -rf $OUTPUT_DIR
sudo rm -rf $TEMP_DIR

# 3. Generate the API client using Docker with the current user
echo "Generating API client using Docker..."
docker run --rm \
    --user $(id -u):$(id -g) \
    -v ${PWD}:/local openapitools/openapi-generator-cli generate \
    -i /local/$OPENAPI_FILE \
    -g typescript-fetch \
    -o /local/$TEMP_DIR \
    --additional-properties=useSingleRequestParameter=false,supportsES6=true,withInterfaces=true

# 4. Create the destination directories
echo "Creating destination directories..."
mkdir -p $OUTPUT_DIR/services
mkdir -p $OUTPUT_DIR/models

# 5. Move the generated files
echo "Moving generated files..."
mv $TEMP_DIR/apis/*.ts $OUTPUT_DIR/services/
mv $TEMP_DIR/models/*.ts $OUTPUT_DIR/models/

# 6. Clean up the temporary directory
echo "Cleaning up temporary directory..."
rm -rf $TEMP_DIR

echo "API client generated successfully!"
