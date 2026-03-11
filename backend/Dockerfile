FROM node:20

# Definir o diretório de trabalho
WORKDIR /app

# Copiar os arquivos de dependência
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar o restante da aplicação
COPY . .

# Gerar o client do Prisma (necessário antes de rodar o app)
RUN npx prisma generate

# Expor a porta do backend
EXPOSE 3000

# Executar as migrações (deploy) e iniciar o servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
