FROM node:22

# 1. Install system dependencies
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends git sudo curl \
    && apt-get clean -y \
    && rm -rf /var/lib/apt/lists/*

# 2. Install global Node.js packages
RUN npm install -g pnpm @openapitools/openapi-generator-cli

# 3. Create a non-root user and give it sudo access
RUN echo "node ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/node \
    && chmod 0440 /etc/sudoers.d/node

# 4. Create the workspace directory and give ownership to the 'node' user
RUN mkdir -p /app/workspace \
    && chown -R node:node /app

USER node

WORKDIR /app/workspace

# Keep the container running indefinitely
CMD [ "sleep", "infinity" ]