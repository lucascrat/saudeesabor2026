# Stage 1: Build the frontend
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Run the server
FROM node:22-slim
WORKDIR /app

# Instala dependências nativas para o better-sqlite3 e o tsx
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
# Instala dependências incluindo devDeps para rodar o servidor com tsx
RUN npm install --include=dev && npm cache clean --force

# Copia os arquivos compilados do frontend e o código do servidor
COPY --from=build /app/dist ./dist
COPY server.ts ./

# Configura o diretório do banco de dados (Volume compatível)
RUN mkdir -p /app/data
# O banco de dados será persistido em /app/data/saude_sabor.db
ENV DATABASE_PATH=/app/data/saude_sabor.db

# Expondo a porta 3000 (padrão Coolify)
EXPOSE 3000

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Comando para iniciar usando tsx como definido no package.json scripts
CMD ["npm", "start"]
