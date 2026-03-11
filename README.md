# 🔄 Monitor-Flow

Sistema completo de monitoramento de aplicações em tempo real.

## 🛠️ Stack Tecnológica

| Camada     | Tecnologia                    |
|------------|-------------------------------|
| Frontend   | Vue.js 3 + Quasar Framework   |
| Backend    | Node.js + Express             |
| Banco      | PostgreSQL + Prisma ORM       |
| Auth       | JWT + bcrypt                  |
| Realtime   | Socket.io                     |
| E-mail     | Nodemailer                    |

## 📁 Estrutura do Projeto

```
monitor-flow/
├── backend/           # API Node.js + Express
│   ├── prisma/        # Schema do banco de dados
│   ├── src/
│   │   ├── config/    # Configurações (DB, Mail)
│   │   ├── middleware/# Auth middleware (JWT)
│   │   ├── routes/    # Rotas da API
│   │   ├── workers/   # Worker de monitoramento
│   │   └── server.js  # Entrada principal
│   └── .env           # Variáveis de ambiente
├── frontend/          # Vue.js + Quasar
│   ├── src/
│   │   ├── components/# Componentes reutilizáveis
│   │   ├── layouts/   # Layouts (Auth)
│   │   ├── pages/     # Páginas
│   │   ├── router/    # Vue Router
│   │   ├── stores/    # Pinia Stores
│   │   ├── services/  # API + Socket.io
│   │   └── styles/    # CSS Global
│   └── vite.config.js
└── README.md
```

## 🚀 Como Executar

### 1. Pré-requisitos

- Node.js 18+
- PostgreSQL

### 2. Configurar o Banco

```sql
CREATE DATABASE monitorflow;
```

### 3. Configurar Backend

```bash
cd backend
cp .env.example .env
# Edite o .env com suas credenciais
npm install
npx prisma migrate dev --name init
npm run dev
```

### 4. Configurar Frontend

```bash
cd frontend
npm install
npm run dev
```

### 5. Acessar

- **Frontend**: http://localhost:9000
- **Backend API**: http://localhost:3000

## ✨ Funcionalidades

- ✅ Autenticação JWT (Login, Registro)
- ✅ Recuperação de Senha via E-mail
- ✅ CRUD de Sistemas Monitorados
- ✅ Monitoramento automático a cada 60s
- ✅ Dashboard Dark Mode Premium
- ✅ Cards Online (Verde) / Offline (Vermelho)
- ✅ Tempo de resposta em ms
- ✅ Atualização em tempo real via Socket.io
- ✅ Design responsivo
