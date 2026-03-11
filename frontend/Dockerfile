# Build stage
FROM node:20-alpine as build-stage

WORKDIR /app

# Copia e instala as dependências do frontend
COPY package*.json ./
RUN npm install

# Copia o restante do código e constrói a aplicação statica
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Limpar arquivos default do Nginx e copiar o build
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copiar a configuração personalizada do Nginx para proxy, fallback e socket
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor a porta que o Nginx está servindo
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
