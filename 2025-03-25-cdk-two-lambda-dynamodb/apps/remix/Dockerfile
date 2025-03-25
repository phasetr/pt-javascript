FROM public.ecr.aws/docker/library/node:20.9.0-slim as builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM public.ecr.aws/docker/library/node:20.9.0-slim as runner
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.0 /lambda-adapter /opt/extensions/lambda-adapter
ENV PORT=3000 NODE_ENV=production
ENV AWS_LWA_ENABLE_COMPRESSION=true
ENV HOST=0.0.0.0 HOME=/tmp
WORKDIR /app
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/build ./build
RUN npm ci --omit=dev

# 元のCMD命令を変更
CMD ["npm", "run", "start"]