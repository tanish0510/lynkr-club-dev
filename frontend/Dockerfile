FROM node:20-alpine

WORKDIR /app

# Install yarn using apk (Alpine package manager)
RUN apk add --no-cache yarn

# Copy package files
COPY package.json yarn.lock* package-lock.json* ./

# Install dependencies
# Use yarn if yarn.lock exists, otherwise use yarn install (project prefers yarn)
# Fallback to npm if yarn fails
# Use --ignore-engines for yarn to ignore Node version checks if needed
# Use --legacy-peer-deps for npm to handle peer dependency conflicts
RUN if [ -f yarn.lock ]; then \
        yarn install --frozen-lockfile --ignore-engines; \
    elif [ -f package-lock.json ]; then \
        npm ci --legacy-peer-deps; \
    else \
        yarn install --ignore-engines || npm install --legacy-peer-deps; \
    fi

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start development server (yarn start or npm start both work)
CMD ["yarn", "start"]
