# ---- deps ----
FROM node:20-alpine AS deps
WORKDIR /app

# Para compatibilidade com algumas libs nativas no Alpine
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# Detecta o gerenciador de pacotes
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable && pnpm i --frozen-lockfile; \
  else echo "Nenhum lockfile encontrado (package-lock/yarn.lock/pnpm-lock.yaml)." && exit 1; \
  fi

# ---- builder ----
FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build do Next
RUN \
  if [ -f package-lock.json ]; then npm run build; \
  elif [ -f yarn.lock ]; then yarn build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable && pnpm build; \
  fi

# ---- runner (prod) ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Usuário não-root
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

# Se você usar "output: 'standalone'" (recomendado), isso fica ótimo:
# Copia o standalone server + assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

USER nextjs
EXPOSE 3000

# Para standalone, o entrypoint é server.js
CMD ["node", "server.js"]
