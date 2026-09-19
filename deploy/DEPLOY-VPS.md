# Deploy do MovieHub em VPS

## Requisitos

- Linux com Docker Engine + Docker Compose plugin
- Domínio apontado para a VPS
- Chaves do TMDB/OMDb
- Parcerias do Ingresso.com compatíveis com sua conta

## 1. Configurar variáveis

Na raiz do projeto:

```bash
cp .env.example .env
nano .env
```

Defina pelo menos `JWT_SECRET` e `TMDB_API_KEY`.

## 2. Subir a aplicação

```bash
docker compose up -d --build
docker compose ps
```

A aplicação ficará disponível em `http://IP_DA_VPS:4173`.

## 3. Migrações

As migrações do Prisma são executadas automaticamente pelo container do backend com:

```bash
npx prisma migrate deploy
```

Não execute `migrate dev` em produção.

## 4. HTTPS

Para produção com domínio, coloque um proxy reverso como Caddy, Nginx ou Traefik na frente da porta 4173 e configure TLS.

## 5. Atualizações

```bash
git pull
docker compose up -d --build
docker image prune -f
```

## Observação

O deploy externo não é executado automaticamente por este pacote porque exige acesso à sua VPS/provedor e às suas credenciais. O projeto está preparado para ser publicado via Docker Compose.
