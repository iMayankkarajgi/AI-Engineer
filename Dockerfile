FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --registry=https://registry.npmjs.org
COPY . .
RUN npm run build
ENV NODE_ENV=production PORT=3001 DATA_DIR=/app/data
VOLUME ["/app/data"]
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s CMD node -e "fetch('http://127.0.0.1:3001/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.mjs"]
