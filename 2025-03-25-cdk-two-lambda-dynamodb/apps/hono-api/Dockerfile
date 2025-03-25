FROM public.ecr.aws/docker/library/node:20.9.0-slim AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM public.ecr.aws/docker/library/node:20.9.0-slim AS runner
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.0 /lambda-adapter /opt/extensions/lambda-adapter
ENV AWS_LWA_ENABLE_COMPRESSION=true
ENV PORT=3000
ENV AWS_LWA_READINESS_CHECK_PATH=/
ENV AWS_LWA_READINESS_CHECK_TIMEOUT=10000
WORKDIR /app
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/build ./build
RUN npm ci --omit=dev

# npmを使わず直接node実行に変更
CMD ["node", "build/index.js"]
