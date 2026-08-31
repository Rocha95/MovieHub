# 🎬 MovieHub

<p align="center">
  <strong>Uma plataforma Full Stack para descobrir, organizar e acompanhar filmes.</strong>
</p>

<p align="center">
  <a href="#-sobre-o-projeto">Sobre</a> •
  <a href="#-funcionalidades">Funcionalidades</a> •
  <a href="#️-tecnologias">Tecnologias</a> •
  <a href="#-arquitetura">Arquitetura</a> •
  <a href="#-como-executar">Como executar</a>
</p>

---

## 📖 Sobre o projeto

O **MovieHub** é uma aplicação Full Stack desenvolvida com o objetivo de centralizar a experiência do usuário com filmes.

A plataforma permite explorar informações cinematográficas, organizar uma biblioteca pessoal, criar listas, acompanhar sessões e descobrir novos filmes através de sugestões personalizadas.

O projeto foi desenvolvido como uma forma de aplicar, na prática, conceitos de **desenvolvimento Full Stack, APIs REST, integração com serviços externos, modelagem de dados, autenticação e construção de interfaces modernas**.

---

## ✨ Funcionalidades

### 🎬 Filmes

* Busca de filmes
* Visualização de informações detalhadas
* Gêneros, avaliações e informações de lançamento
* Integração com dados cinematográficos externos
* Exploração de filmes relacionados

### 📚 Biblioteca

* Biblioteca pessoal de filmes
* Organização dos filmes
* Controle de filmes assistidos
* Filmes para assistir posteriormente
* Acompanhamento da experiência do usuário

### ❤️ Listas

* Criação de listas personalizadas
* Adição e remoção de filmes
* Organização dos filmes de acordo com diferentes critérios

### 🎟️ Sessões

* Registro e acompanhamento de sessões
* Histórico de filmes assistidos
* Organização da experiência cinematográfica

### 🤖 Sugestões

* Sugestões baseadas nas preferências do usuário
* Descoberta de novos filmes
* Exploração de títulos semelhantes

### 📊 Dashboard

* Visão geral da biblioteca
* Estatísticas dos filmes
* Informações sobre filmes assistidos
* Indicadores e dados para acompanhar os hábitos cinematográficos

---

## 🖥️ Preview

> 📸 Screenshots da aplicação serão adicionados conforme o desenvolvimento do projeto.

## Tela Inicial 
<img width="1224" height="907" alt="image" src="https://github.com/user-attachments/assets/bfeef329-5bfd-406e-803d-c9a99ff9b17c" />

### Dashboard

<!-- Adicione aqui uma imagem do Dashboard -->

<!-- ![MovieHub Dashboard](./docs/images/dashboard.png) -->

### Biblioteca

<!-- ![MovieHub Biblioteca](./docs/images/biblioteca.png) -->

### Detalhes do filme

<!-- ![MovieHub Filme](./docs/images/movie-details.png) -->

---

## 🏗️ Arquitetura

O MovieHub foi desenvolvido seguindo uma arquitetura separando **frontend, backend e banco de dados**.

```text
                    ┌─────────────────────┐
                    │      MovieHub       │
                    │      Frontend       │
                    │       React         │
                    └──────────┬──────────┘
                               │
                               │ HTTP / REST
                               ▼
                    ┌─────────────────────┐
                    │       Backend       │
                    │    Node.js / API    │
                    │      Express        │
                    └──────────┬──────────┘
                               │
                         Prisma ORM
                               │
                               ▼
                    ┌─────────────────────┐
                    │     PostgreSQL      │
                    │      Database       │
                    └─────────────────────┘
                               │
                               │
                    ┌──────────▼──────────┐
                    │      TMDB API       │
                    │  Dados de filmes    │
                    └─────────────────────┘
```

---

## 🛠️ Tecnologias

### Frontend

* ⚛️ **React**
* ⚡ **Vite**
* JavaScript
* HTML5
* CSS

### Backend

* 🟢 **Node.js**
* 🚂 **Express**
* API REST

### Banco de dados

* 🐘 **PostgreSQL**
* 🔷 **Prisma ORM**

### Integrações

* 🎬 **TMDB API**

### Ferramentas

* Git
* GitHub
* Insomnia
* VS Code

---

## 📂 Estrutura do projeto

```text
MovieHub/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── ...
│   │
│   └── ...
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   └── ...
│   │
│   ├── prisma/
│   │   └── schema.prisma
│   │
│   └── ...
│
└── README.md
```

---

## 🚀 Como executar

### Pré-requisitos

Antes de iniciar, você precisará ter instalado:

* [Node.js](https://nodejs.org/)
* PostgreSQL
* Git

### 1. Clone o repositório

```bash
git clone https://github.com/SEU-USUARIO/moviehub.git

cd moviehub
```

### 2. Instale as dependências

Frontend:

```bash
cd frontend
npm install
```

Backend:

```bash
cd ../backend
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` no backend:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/moviehub"

TMDB_API_KEY="sua_chave_api"
```

> ⚠️ Nunca publique suas chaves de API ou credenciais no repositório.

### 4. Configure o banco de dados

Execute as migrations do Prisma:

```bash
npx prisma migrate dev
```

### 5. Inicie o backend

```bash
npm run dev
```

### 6. Inicie o frontend

Em outro terminal:

```bash
cd frontend
npm run dev
```

Depois, acesse a aplicação através da URL exibida pelo Vite.

---

## 🧠 Principais conceitos aplicados

O desenvolvimento do MovieHub permite colocar em prática conceitos como:

* Desenvolvimento Full Stack
* Arquitetura cliente-servidor
* APIs REST
* Integração com APIs externas
* Modelagem relacional
* ORM com Prisma
* PostgreSQL
* Componentização com React
* Gerenciamento de estado
* Autenticação e autorização
* Variáveis de ambiente
* Git e GitHub
* Organização de código
* Separação de responsabilidades

---

## 🔮 Próximos passos

O MovieHub continua em desenvolvimento e novas funcionalidades podem ser adicionadas ao longo do projeto.

Algumas possibilidades:

* [ ] Comentários sobre os filmes assistidos
* [ ] Melhorias no dashboard
* [ ] Sistema de recomendações baseado no histórico
* [ ] Melhorias de responsividade
* [ ] Testes automatizados
* [ ] Dockerização da aplicação
* [ ] Deploy da aplicação
* [ ] Melhorias de performance e cache

---

## 🎯 Objetivo do projeto

Além de criar uma aplicação relacionada a cinema, o MovieHub tem como objetivo servir como um projeto prático para evolução em **desenvolvimento web moderno e arquitetura Full Stack**.

Através dele, estou explorando a integração entre **React, Node.js, PostgreSQL, Prisma e APIs externas**, buscando desenvolver não apenas funcionalidades, mas também boas práticas de arquitetura, organização e experiência do usuário.

---

## 👨‍💻 Autor

**Gustavo Rocha**

Desenvolvedor de Software interessado em desenvolvimento Full Stack, arquitetura de sistemas e novas tecnologias.

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat\&logo=github\&logoColor=white)](https://github.com/Rocha95)

---

⭐ Se este projeto foi útil ou interessante para você, considere deixar uma estrela no repositório!
