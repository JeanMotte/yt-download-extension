#!/bin/bash

# 1. Set up variables
OPENAPI_FILE="api/openapi.json"
OUTPUT_DIR="src/api"
TEMP_DIR="temp_api"

# 2. Clean up previous generation
rm -rf $OUTPUT_DIR
rm -rf $TEMP_DIR

# 3. Generate the API client
openapi-generator-cli generate -i $OPENAPI_FILE -g typescript-fetch -o $TEMP_DIR

# 4. Create the destination directories
mkdir -p $OUTPUT_DIR/services
mkdir -p $OUTPUT_DIR/models

# 5. Move the generated files
mv $TEMP_DIR/apis/*.ts $OUTPUT_DIR/services/
mv $TEMP_DIR/models/*.ts $OUTPUT_DIR/models/

# 6. Clean up the temporary directory
rm -rf $TEMP_DIR

echo "API client generated successfully!"
