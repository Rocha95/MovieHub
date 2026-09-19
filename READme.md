# MovieHub — Refatoração Full Stack

MovieHub é uma aplicação de catálogo e gestão de experiência cinematográfica construída com **Node.js + Express + React + PostgreSQL + Prisma**, integrada ao TMDB, OMDb e Ingresso.com.

## O que foi preservado

- Busca e detalhes de filmes
- Filmes populares, bem avaliados, próximos lançamentos e em cartaz
- Biblioteca pessoal
- Watchlist e filmes assistidos
- Avaliação de 0 a 10
- Listas personalizadas
- Sessões/localização
- Sugestões por filme
- Quiz "O que assistir hoje?"
- Dashboard e métricas
- Bilheteria
- Autenticação JWT
- Upload de capas de listas

## Melhorias implementadas

### 1. Sessões por cidade

A integração agora resolve a cidade pelo catálogo do Ingresso.com e usa o `cityId` para consultar diretamente os filmes em cartaz daquela cidade. O comportamento antigo que caía em Sorocaba para cidades desconhecidas foi removido.

Configure:

```env
INGRESSO_PARTNERSHIPS=cinemark,cinepolis,uci,moviecom
```

Use somente as parcerias disponíveis para a sua integração.

### 2. Comentários

Novo modelo `MovieComment` e endpoints:

- `GET /comments/:movieId`
- `PUT /comments/:movieId`
- `DELETE /comments/:movieId`

Somente usuários que registraram o filme como `WATCHED` podem comentar.

### 3. Recomendações pelo histórico

Novo endpoint autenticado:

```text
GET /recommendations/personalized
```

O algoritmo considera os filmes assistidos e pondera os gêneros de acordo com as avaliações do usuário. Os títulos já assistidos são excluídos do resultado.

### 4. Responsividade

- Navbar com menu mobile
- Busca adaptada para telas menores
- Grades responsivas
- Ajustes globais de overflow, imagens e formulários

### 5. Performance e cache

Foi criado um cache TTL em memória com deduplicação de requisições simultâneas.

Aplicado principalmente a:

- detalhes do TMDB
- buscas
- listas do TMDB
- recomendações
- provedores
- bilheteria
- cidades do Ingresso.com
- filmes em cartaz por cidade

Em produção com múltiplas instâncias, substitua o cache em memória por Redis para compartilhar o cache entre processos.

### 6. Segurança das chaves

As chaves do TMDB/OMDb não são mais expostas nas páginas React. As consultas passam pelo backend.

**Importante:** o `.env` original do pacote recebido não é incluído no projeto final.

### 7. Testes

Backend:

```bash
cd backend
npm install
npm test
```

Também há validação de sintaxe dos arquivos Node.

### 8. Docker

Subir PostgreSQL + backend + frontend:

```bash
cp .env.example .env
docker compose up -d --build
```

Frontend:

```text
http://localhost:4173
```

Backend:

```text
http://localhost:3000
```

Health check:

```text
http://localhost:3000/health
```

### 9. Prisma

Depois de instalar dependências:

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

Para produção:

```bash
npm run prisma:deploy
```

A nova migration adiciona comentários e índices para consultas frequentes.

## Variáveis de ambiente

Consulte `.env.example` e `backend/.env.example`.

Nunca versione `.env`.

## Deploy

O projeto inclui:

- `docker-compose.yml`
- Dockerfile do backend
- Dockerfile do frontend
- configuração Nginx para SPA + proxy da API
- health checks
- guia `deploy/DEPLOY-VPS.md`

O deploy em um provedor externo precisa ser executado usando as credenciais/infraestrutura do proprietário.

## Estrutura

```text
MovieHub/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   └── src/
│       ├── clients/
│       ├── controllers/
│       ├── middlewares/
│       ├── routes/
│       ├── services/
│       ├── utils/
│       └── validators/
├── frontend/
│   └── src/
│       ├── api/
│       ├── components/
│       ├── context/
│       └── pages/
├── deploy/
├── docker-compose.yml
└── .env.example
```

## Nota sobre Ingresso.com

A integração depende da API de conteúdo do Ingresso.com e das parcerias autorizadas. A documentação atual disponibiliza endpoints específicos por cidade, incluindo `templates/nowplaying/{cityId}/partnership/{partnership}`. Se uma parceria deixar de estar disponível, ela deve ser removida de `INGRESSO_PARTNERSHIPS`.
