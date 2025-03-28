FROM public.ecr.aws/docker/library/node:20.9.0-slim AS builder
WORKDIR /app

# Create a temporary package.json without the @cbal/db dependency
COPY package.json .
RUN cat package.json | grep -v "@cbal/db" > temp-package.json && \
    mv temp-package.json package.json

# Copy and install dependencies
COPY package-lock.json .
RUN npm install
RUN npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb @aws-sdk/client-secrets-manager @aws-sdk/util-dynamodb typescript

# Copy the rest of the app
COPY . .

# Create a minimal tsconfig.json file
RUN echo '{ "compilerOptions": { "target": "ES2022", "module": "NodeNext", "moduleResolution": "NodeNext", "outDir": "dist", "esModuleInterop": true, "skipLibCheck": true } }' > /app/tsconfig.json

# Create db directory and copy the compiled files
WORKDIR /app/node_modules/@cbal
RUN mkdir -p db/dist
WORKDIR /app
COPY ./node_modules/@cbal/db/dist ./node_modules/@cbal/db/dist
COPY ./node_modules/@cbal/db/package.json ./node_modules/@cbal/db/package.json

# Build the app
RUN npm run build

FROM public.ecr.aws/docker/library/node:20.9.0-slim AS runner
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.0 /lambda-adapter /opt/extensions/lambda-adapter
ENV AWS_LWA_ENABLE_COMPRESSION=true
ENV PORT=3000
ENV AWS_LWA_READINESS_CHECK_PATH=/
ENV AWS_LWA_READINESS_CHECK_TIMEOUT=10000
WORKDIR /app

# Copy only the necessary files
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Direct node execution
CMD ["node", "./dist/index.js"]
