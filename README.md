# lv-frontend

Interface web do sistema de Logistica Verde. Permite inserir os pontos de entrega sobre o mapa, disparar o calculo da rota e visualizar lado a lado o trajeto de menor distancia e o de menor emissao de CO2.

Modulo do TCC *Sistema de Logistica Verde Inteligente com Otimizacao por Inteligencia Artificial e Auditoria em Blockchain* - Engenharia de Software, UNIP, 2026.

## Stack

- React.js
- Leaflet.js para renderizacao do mapa e das rotas
- Distribuicao via Amazon S3 + CloudFront

## Pre-requisitos

- Node.js 20 ou superior
- `lv-api` em execucao (local ou remota)

## Como rodar

```bash
npm install
npm run dev
```

Crie um arquivo `.env` na raiz apontando para a API:

```
VITE_API_URL=http://localhost:8080
```

## Estrutura

```
src/
  components/   componentes de interface reutilizaveis
  pages/        telas da aplicacao
  services/     chamadas HTTP para a lv-api
  hooks/        hooks compartilhados
```

## Modulos do projeto

| Repositorio | Responsabilidade |
|---|---|
| lv-frontend | Interface web (este repositorio) |
| lv-api | API REST, orquestracao e persistencia |
| lv-optimizer | Motor de Algoritmos Geneticos (Green-VRP) |
| lv-infra | Ambiente Docker, Besu e banco de dados |
| lv-docs | Diagramas, arquitetura e resultados |

Comece pelo `lv-infra`, que sobe o banco e o no blockchain.

## Docker

O `Dockerfile` gera o build de producao e o serve com nginx. O `nginx.conf` repassa `/api/` para o servico `api` e devolve `index.html` para as rotas do React Router. Como a API fica no mesmo endereco, o build usa `VITE_API_URL` vazio (chamadas relativas a `/api`).

O compose completo, com a API, o banco e o resto, fica no `lv-api` (pasta `deploy`). Para construir so o front:

```bash
docker build -t lastro-web .
```
