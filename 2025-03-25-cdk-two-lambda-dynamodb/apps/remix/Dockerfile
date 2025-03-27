FROM public.ecr.aws/docker/library/node:20.9.0-slim AS builder
WORKDIR /app

# Create a temporary package.json without the @ctld/db-lib dependency
COPY package.json .
RUN cat package.json | grep -v "@ctld/db-lib" > temp-package.json && \
    mv temp-package.json package.json

# Copy and install dependencies
COPY package-lock.json .
RUN npm install
RUN npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb

# Copy the rest of the app
COPY . .

# Create db-lib directory and copy the compiled files
WORKDIR /app/node_modules/@ctld
RUN mkdir -p db-lib/dist
WORKDIR /app
COPY ./node_modules/@ctld/db-lib/dist ./node_modules/@ctld/db-lib/dist
COPY ./node_modules/@ctld/db-lib/package.json ./node_modules/@ctld/db-lib/package.json

# Build the app
RUN npm run build

FROM public.ecr.aws/docker/library/node:20.9.0-slim AS runner
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.0 /lambda-adapter /opt/extensions/lambda-adapter
ENV PORT=3000
ENV AWS_LWA_ENABLE_COMPRESSION=true
ENV HOST=0.0.0.0 HOME=/tmp
WORKDIR /app

# Copy only the necessary files
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules

# Run the app
CMD ["npm", "run", "start"]
