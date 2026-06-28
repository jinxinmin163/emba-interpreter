FROM node:22-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --prod

COPY server.js ./
COPY public ./public
COPY .env.example ./

ENV NODE_ENV=production
ENV PORT=4321

EXPOSE 4321

CMD ["node", "server.js"]
