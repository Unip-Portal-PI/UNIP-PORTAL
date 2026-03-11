# AVP Conecta

Uma API robusta e escalável desenvolvida com **FastAPI** para o gerenciamento de ecossistemas universitarios. O projeto centraliza o controle de usuários, a divulgação de eventos acadêmicos e a gestão de oportunidades de estágio, utilizando práticas modernas de desenvolvimento e segurança.

> [!IMPORTANT]  
> O projeto ainda está em fase de desenvolvimento e não representa uma versão real do produto final.

## Tecnologias e Ferramentas

* **Framework:** [FastAPI](https://fastapi.tiangolo.com/)
* **Banco de Dados:** MySQL com [SQLAlchemy ORM](https://www.sqlalchemy.org/)
* **Segurança:** Autenticação JWT e Hashing **Argon2** via Passlib
* **Validação de Dados:** [Pydantic V2](https://www.google.com/search?q=https://docs.pydantic.dev/)
* **Configuração:** Pydantic Settings (Suporte a arquivos `.env`)
* **Servidor:** Uvicorn

---

## Arquitetura do Sistema

O projeto utiliza uma arquitetura baseada em **Camadas (Layered Architecture)** para garantir a separação de responsabilidades e facilitar a manutenção:

1. **Endpoints (`/endpoints`)**: Camada de entrada que define as rotas HTTP e valida os contratos de dados (Schemas).
2. **Business Logic (`/business/services`)**: Onde residem as regras de negócio, como validação de permissões e processamento de dados.
3. **Persistence (`/persistence`)**:
* **Models**: Definições das tabelas do banco de dados.
* **Repositories**: Abstração da lógica de acesso aos dados (Queries, Commits).


4. **Core (`/core`)**: Configurações globais de segurança, segredos e conexões.

---

## Segurança e Configurações

### Gerenciamento de Ambiente

O projeto utiliza um arquivo `.env` para proteger informações sensíveis. As variáveis são carregadas via `pydantic-settings`, garantindo que o sistema não inicie se houver configurações faltando.

### Criptografia de Senhas

Utilizamos o algoritmo **Argon2**, superior ao bcrypt, para o hashing de senhas. O sistema trata automaticamente o limite de segurança de 72 bytes para garantir compatibilidade e resistência contra ataques de força bruta.

---

## Estrutura de Pastas

```text
├── api/
│   └── main.py              # Ponto de entrada e registro de routers
├── business/
│   └── services/            # Serviços com a lógica de negócio
├── core/
│   ├── config.py            # Centralização de variáveis (.env)
│   └── security.py          # Utilitários de JWT e Hashing
├── endpoints/               # Definição das rotas (Controllers)
├── persistence/
│   ├── models/              # Modelos SQLAlchemy
│   ├── repositories/        # Camada de acesso ao banco
│   └── database.py          # Configuração da Session e Engine
└── schemas/                 # Pydantic Schemas (Validação)

```

---

## Como Configurar e Executar

### 1. Requisitos

* Python 3.10 ou superior
* MySQL 8.0+

### 2. Instalação

```bash
# Crie e ative o ambiente virtual
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Instale as dependências
pip install -r requirements.txt

```

### 3. Variáveis de Ambiente

Crie um arquivo **`.env`** na raiz do projeto:

```env
SECRET_KEY=EXAMPLE
ALGORITHM=EXAMPLE
ACCESS_TOKEN_EXPIRE_MINUTES=99
DATABASE_URL=mysql+pymysql://your:password@localhost:3306/university_platform

```

### 4. Execução

```bash
python -m api.main

```

A API estará disponível em `http://127.0.0.1:8000`.

---

## Documentação Interativa

A API gera documentação automática que pode ser acessada em tempo real:

* **Swagger UI:** [http://127.0.0.1:8000/docs](https://www.google.com/search?q=http://127.0.0.1:8000/docs)
* **ReDoc:** [http://127.0.0.1:8000/redoc](https://www.google.com/search?q=http://127.0.0.1:8000/redoc)

---

## Resumo de Endpoints Disponíveis

| Módulo | Prefixo | Descrição |
| --- | --- | --- |
| **Users** | `/users` | Registro, Login e Gestão de usuários. |
| **Events** | `/events` | Criação e listagem de eventos acadêmicos. |
| **Internships** | `/internships` | Divulgação e controle de vagas de estágio. |

---

## Rotas

Esta seção detalha como interagir com cada endpoint da API.

### Informações de Autenticação e Headers

A maioria das rotas (exceto registro e login) exige um Token JWT para acesso.

| Header | Descrição |
| --- | --- |
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer <seu_token_jwt>` |

---

### Módulo de Usuários (`/users`)

#### 1. Registrar Usuário

* **Método:** `POST`
* **Rota:** `/users/register`
* **Body:**

```json
{
  "name": "João Exemplo",
  "email": "joao@email.com",
  "password": "senha_segura",
  "role": "student"
}

```

#### 2. Login

* **Método:** `POST`
* **Rota:** `/users/login`
* **Body:**

```json
{
  "email": "joao@email.com",
  "password": "senha_segura"
}

```

#### 3. Listar Usuários

* **Método:** `GET`
* **Rota:** `/users/`
* **Query Params:** `skip` (default: 0), `limit` (default: 10)

#### 4. Atualizar Usuário

* **Método:** `PUT`
* **Rota:** `/users/{user_id}`
* **Body:** (Mesma estrutura do `UserCreate`)

---

## Módulo de Eventos (`/events`)

#### 1. Criar Evento

* **Método:** `POST`
* **Rota:** `/events/`
* **Body:**

```json
{
  "name": "Formatura 2026",
  "description": "Cerimônia oficial de colação de grau",
  "location": "Auditório Central",
  "date": "2026-12-15T19:00:00",
  "time": "19:00",
  "enrollment_info": "Confirmar presença até 01/12"
}

```

#### 2. Listar Eventos

* **Método:** `GET`
* **Rota:** `/events/`
* **Query Params:** `skip`, `limit`

#### 3. Atualizar Evento

* **Método:** `PUT`
* **Rota:** `/events/{event_id}`
* **Body:** (Mesma estrutura do `EventCreate`)

---

## Módulo de Estágios (`/internships`)

#### 1. Criar Vaga de Estágio

* **Método:** `POST`
* **Rota:** `/internships/`
* **Body:**

```json
{
  "company": "Tech Corp",
  "position": "Estágio em Backend",
  "description": "Desenvolvimento de APIs com FastAPI",
  "location": "Remoto",
  "start_date": "2026-06-01T09:00:00",
  "end_date": "2026-12-01T18:00:00"
}

```

#### 2. Atualizar Vaga

* **Método:** `PUT`
* **Rota:** `/internships/{internship_id}`
* **Body:** (Mesma estrutura do `InternshipCreate`)

---

## Rotas de Deleção (Padrão)

Todas as rotas de deleção seguem a mesma estrutura de resposta:

* **Rotas:** `DELETE /users/{id}`, `DELETE /events/{id}`, `DELETE /internships/{id}`
* **Resposta de Sucesso (200):**

```json
{ "message": "Recurso removido com sucesso" }

```

---

## Resumo Técnico dos Tipos de Dados

Ao enviar dados para a API, atente-se aos tipos definidos no **Pydantic**:

* **`EmailStr`**: Deve ser um e-mail válido (ex: `teste@dominio.com`).
* **`datetime`**: Deve seguir o formato ISO 8601 (ex: `YYYY-MM-DDTHH:MM:SS`).
* **`Optional`**: Campos como `description` e `enrollment_info` podem ser enviados como `null` ou omitidos.

## Licença

Este software é um produto comercial e proprietário.

O uso, cópia, modificação, fusão, publicação, distribuição, sublicenciamento ou venda de cópias deste software é estritamente proibido sem a autorização prévia por escrito do proprietário dos direitos autorais.

- O código-fonte é confidencial e para uso exclusivamente interno.
- Nenhuma parte deste projeto pode ser reproduzida ou transmitida de qualquer forma ou por qualquer meio.
- A violação destes termos estará sujeita às penalidades previstas na legislação de propriedade intelectual e direitos autorais.
