# Use a Node.js v14 base image with Yarn v3 installed
FROM node:18-alpine AS build

# RUN npm install -g yarn@3

# Set the working directory
WORKDIR /app

# Copy the package.json and yarn.lock files to the container
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn .yarn

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the application files to the container
COPY . .

# Build the TypeScript project
RUN yarn build

# Use a smaller Node.js v14 base image to run the application
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy the compiled JavaScript files from the build stage
COPY --from=build /app/dist ./dist

# Install only production dependencies
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn .yarn
RUN yarn workspaces focus --all --production

# Expose port 8080 for the Node.js application
EXPOSE 8080

# Start the Node.js application
CMD ["node", "dist/server.js"]
