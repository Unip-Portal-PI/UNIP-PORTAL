# AVP Conecta — API de Gestão Acadêmica

> Sistema de gestão universitária desenvolvido com **FastAPI**, cobrindo controle de usuários com autenticação OTP, eventos acadêmicos com QR Code, inscrições, certificados, vagas de estágio e comunicados institucionais.

---

## Sumário

- [Tecnologias](#tecnologias)
- [Arquitetura](#arquitetura)
- [Configuração e Execução](#configuração-e-execução)
- [Autenticação](#autenticação)
- [Endpoints](#endpoints)
  - [Diagnóstico](#diagnóstico)
  - [Usuários](#módulo-de-usuários-users)
  - [Eventos](#módulo-de-eventos-events)
  - [Inscrições](#módulo-de-inscrições-enrollments)
  - [Estágios](#módulo-de-estágios-internships)
  - [Notícias](#módulo-de-notícias-news)
  - [Certificados](#módulo-de-certificados-certificates)
  - [Dashboard do Aluno](#módulo-de-dashboard-student)
  - [Administração](#módulo-de-administração-admin)
- [Roles e Permissões](#roles-e-permissões-rbac)
- [Códigos de Erro](#códigos-de-erro-comuns)
- [Testes](#testes)
- [Dicas de Desenvolvimento](#dicas-de-desenvolvimento)
- [Licença](#licença)

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Framework | FastAPI |
| Banco de Dados | MySQL 8.0+ via SQLAlchemy ORM |
| Autenticação | JWT (python-jose) + OTP de 6 dígitos |
| Hashing de Senhas | Argon2 via Passlib |
| Validação | Pydantic V2 |
| E-mail | Resend API |
| Geração de PDF | FPDF2 |
| Servidor | Uvicorn |

---

## Arquitetura

O projeto segue uma **Arquitetura em Camadas** com separação clara de responsabilidades:

```
api/
└── main.py                  # Ponto de entrada, registro de routers e middlewares

endpoints/                   # Camada HTTP — define rotas e contratos de dados
business/
└── services/                # Regras de negócio (AuthService, EventService...)
persistence/
├── models/                  # Modelos SQLAlchemy (tabelas do banco)
├── repositories/            # Acesso ao banco (queries, commits)
└── database.py              # Engine, SessionLocal e get_db()
core/
├── config.py                # Variáveis de ambiente (.env)
└── security.py              # JWT, hashing, RBAC (RoleChecker)
schemas/                     # Pydantic Schemas — validação de entrada e saída
static/                      # Arquivos estáticos (banners, QR codes, certificados)
test/                        # Testes automatizados (Unitários e Integração)
```

**Fluxo de uma requisição:**
```
Cliente → Endpoint (Router) → Service (Regras) → Repository (Banco) → Resposta
```

---

## Configuração e Execução

### Requisitos

- Python 3.10 ou superior
- MySQL 8.0+

### 1. Clonar e criar ambiente virtual

```bash
git clone <url-do-repositório>
cd UNIP-PORTAL

git checkout api-base

cd backend

python -m venv venv
source venv/bin/activate        # Linux/macOS
venv\Scripts\activate           # Windows
```

### 2. Instalar dependências

```bash
pip install -r requirements.txt
```

### 3. Configurar o arquivo `.env`

Crie um arquivo `.env` na raiz do projeto com as variáveis abaixo:

```env
# Segurança JWT
SECRET_KEY=sua_chave_secreta_longa_e_aleatória
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Banco de Dados
DATABASE_URL=mysql+pymysql://usuario:senha@localhost:3306/university_platform

# E-mail via Resend
RESEND_API_KEY=re_sua_api_key_aqui
EMAIL_FROM=noreply@seudominio.com

# OTP
OTP_LENGTH=6
OTP_EXPIRATION_MINUTES=10
```

> **Dica:** A `SECRET_KEY` deve ser uma string longa e aleatória. Você pode gerar uma com:
> ```bash
> python -c "import secrets; print(secrets.token_hex(32))"
> ```

### 4. Criar as tabelas no banco

Criar a pasta versions dentro da pasta alembic

```bash
# Gerar o script de migração (o "commit" do banco)
alembic revision --autogenerate -m "Criando tabelas iniciais"

# Executa a migração e cria as tabelas
alembic upgrade head
```

### 5. Executar o servidor

```bash
python -m api.main
```

A API estará disponível em: `http://127.0.0.1:8000`

- **Swagger UI (docs interativos):** `http://127.0.0.1:8000/docs`
- **ReDoc:** `http://127.0.0.1:8000/redoc`

---

## Autenticação

A API utiliza **JWT (Bearer Token)** combinado com **OTP de 6 dígitos** por e-mail.

### Fluxo completo de acesso

```
1. POST /users/register      → Cadastro (recebe OTP no e-mail)
2. POST /users/verify-otp    → Ativa a conta com o código recebido
3. POST /users/login         → Recebe o JWT
4. Usar o JWT em todas as rotas protegidas
```

### Como enviar o token

Inclua o header `Authorization` em todas as requisições protegidas:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Estrutura do payload JWT

```json
{
  "sub": "1",
  "role": "student",
  "name": "João Silva",
  "exp": 1700000000
}
```

> **Importante:** O token é invalidado automaticamente se a `role` do usuário for alterada no banco — o sistema exige novo login por segurança.

---

## Endpoints

### Diagnóstico

#### `GET /`
Verifica o status da API.

**Resposta `200`:**
```json
{
  "status": "online",
  "message": "AVP UNIP - Sistema de Segurança com OTP ativado!",
  "version": "1.3.0",
  "methods": {
    "auth": "JWT + OTP (4 digits)",
    "storage": "Local Filesystem (Static)"
  }
}
```

---

### Módulo de Usuários (`/users`)

#### `POST /users/register`
Cadastra um novo usuário. O **primeiro cadastro** recebe `role: admin` automaticamente. Os demais recebem `role: student` e precisam ativar a conta via OTP.

**Autenticação:** Não requerida

**Body:**
```json
{
  "name": "João Silva",
  "nickname": "joao",
  "registration_number": "RA12345",
  "email": "joao@email.com",
  "password": "Senha123",
  "area": "Computação",
  "phone": "(11) 99999-9999",
  "birth_date": "2000-01-15"
}
```

| Campo | Tipo | Obrigatório | Regra |
|---|---|---|---|
| `name` | string | ✅ | 3–100 caracteres |
| `nickname` | string | ✅ | 2–50 caracteres |
| `registration_number` | string | ✅ | 5–20 caracteres, único |
| `email` | string (EmailStr) | ✅ | E-mail válido, único |
| `password` | string | ✅ | Mín. 8 chars, 1 maiúscula, 1 minúscula, 1 número |
| `area` | string | ✅ | 2–100 caracteres |
| `phone` | string | ❌ | Formatado automaticamente (só dígitos) |
| `birth_date` | date (YYYY-MM-DD) | ❌ | — |

**Resposta `201`:**
```json
{
  "id": 1,
  "name": "João Silva",
  "nickname": "joao",
  "registration_number": "RA12345",
  "email": "joao@email.com",
  "area": "Computação",
  "phone": "11999999999",
  "birth_date": "2000-01-15",
  "role": "student",
  "is_active": false
}
```

---

#### `POST /users/verify-otp`
Ativa a conta usando o código de 6 dígitos enviado por e-mail.

**Autenticação:** Não requerida

**Body:**
```json
{
  "email": "joao@email.com",
  "code": "482910"
}
```

**Resposta `200`:**
```json
{
  "message": "Conta ativada com sucesso! Agora você pode realizar o login."
}
```

---

#### `POST /users/login`
Realiza login com matrícula e senha. Retorna o token JWT.

**Autenticação:** Não requerida

**Body:**
```json
{
  "registration": "RA12345",
  "password": "Senha123"
}
```

**Resposta `200`:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "role": "student",
  "nickname": "joao"
}
```

---

#### `POST /users/forgot-password/request`
Envia um código de recuperação para o e-mail informado.

**Autenticação:** Não requerida

**Body:**
```json
{
  "email": "joao@email.com"
}
```

**Resposta `200`:**
```json
{
  "message": "Se o e-mail existir, um código de recuperação foi enviado."
}
```

---

#### `POST /users/forgot-password/confirm`
Redefine a senha usando o código de recuperação.

**Autenticação:** Não requerida

**Body:**
```json
{
  "email": "joao@email.com",
  "otp_code": "482910",
  "new_password": "NovaSenha123"
}
```

**Resposta `200`:**
```json
{
  "message": "Senha redefinida com sucesso."
}
```

---

#### `GET /users/me`
Retorna os dados do usuário logado.

**Autenticação:** ✅ Requerida (qualquer role)

**Resposta `200`:** _(mesmo formato de UserResponse)_

---

#### `PUT /users/me`
Atualiza dados do próprio perfil.

**Autenticação:** ✅ Requerida (qualquer role)

**Body:**
```json
{
  "name": "João da Silva",
  "nickname": "joaosilva",
  "email": "novoemail@email.com",
  "area": "Engenharia",
  "phone": "(21) 98888-7777",
  "birth_date": "2000-06-20"
}
```
> Todos os campos são opcionais. Envie apenas o que deseja alterar.

---

#### `POST /users/me/request-password-otp`
Solicita um código para troca de senha (usuário já logado).

**Autenticação:** ✅ Requerida (qualquer role)

**Body:** _(sem body)_

**Resposta `200`:**
```json
{
  "message": "Código de verificação enviado para o seu e-mail."
}
```

---

#### `POST /users/me/confirm-password-change`
Confirma a troca de senha com o código recebido.

**Autenticação:** ✅ Requerida (qualquer role)

**Body:**
```json
{
  "otp_code": "391047",
  "new_password": "NovaSenha456"
}
```

**Resposta `200`:**
```json
{
  "message": "Senha alterada com sucesso!"
}
```

---

#### `PATCH /users/promote`
Altera o nível de acesso de um usuário.

**Autenticação:** ✅ Requerida — `admin`

**Body:**
```json
{
  "user_id": 5,
  "new_role": "staff"
}
```

| Valores válidos para `new_role` |
|---|
| `"student"` |
| `"staff"` |
| `"admin"` |

**Resposta `200`:**
```json
{
  "message": "Nível de acesso do usuário 5 alterado para 'staff'."
}
```

---

#### `GET /users/all`
Lista todos os usuários cadastrados.

**Autenticação:** ✅ Requerida — `admin`

**Query Params:**

| Parâmetro | Tipo | Default | Descrição |
|---|---|---|---|
| `skip` | int | `0` | Paginação — registros a pular |
| `limit` | int | `100` | Máximo de registros |

---

#### `DELETE /users/{user_id}`
Desativa (soft delete) um usuário. Não é possível deletar a própria conta.

**Autenticação:** ✅ Requerida — `admin`

**Resposta `200`:**
```json
{
  "message": "Usuário desativado com sucesso."
}
```

---

### Módulo de Eventos (`/events`)

> As operações de escrita (POST, PUT, DELETE) usam **Multipart Form-Data** para suportar upload de banner.

#### `POST /events/`
Cria um novo evento acadêmico com imagem de banner.

**Autenticação:** ✅ Requerida — `admin` ou `staff`

**Content-Type:** `multipart/form-data`

**Campos do formulário:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `title` | string | ✅ | Título do evento (mín. 3 chars) |
| `event_date` | date (YYYY-MM-DD) | ✅ | Não pode ser no passado |
| `start_time` | string (HH:mm) | ✅ | Horário de início |
| `shift` | string | ✅ | `Manhã`, `Tarde` ou `Noite` |
| `location` | string | ✅ | Local físico ou link |
| `deadline_date` | date (YYYY-MM-DD) | ✅ | Prazo de inscrição |
| `total_slots` | int | ✅ | Total de vagas (mín. 0) |
| `banner` | file | ✅ | Imagem de destaque (JPG, PNG...) |
| `short_description` | string | ❌ | Resumo para listagens (máx. 120 chars) |
| `full_description` | string | ❌ | Descrição completa |
| `area` | string | ❌ | Área acadêmica (default: `"Geral"`) |
| `registration_type` | string | ❌ | `"interna"` (default) ou `"externa"` |
| `external_url` | string | ❌ | Obrigatório se `registration_type = "externa"` |
| `visibility` | string | ❌ | `"publica"` (default) ou `"privada"` |

**Resposta `201`:**
```json
{
  "id": 1,
  "title": "Semana de TI 2025",
  "area": "Computação",
  "event_date": "2025-10-15",
  "start_time": "08:00",
  "shift": "Manhã",
  "location": "Auditório A",
  "deadline_date": "2025-10-10",
  "total_slots": 200,
  "occupied_slots": 0,
  "registration_type": "interna",
  "external_url": null,
  "visibility": "publica",
  "banner_url": "/static/banners/uuid-gerado.jpg",
  "is_active": true,
  "owner_id": 1,
  "created_at": "2025-01-01T10:00:00",
  "updated_at": "2025-01-01T10:00:00",
  "attachments": []
}
```

---

#### `PUT /events/{event_id}`
Atualiza um evento existente. Todos os campos são opcionais.

**Autenticação:** ✅ Requerida — `admin` ou `staff`

**Content-Type:** `multipart/form-data`

| Campo | Tipo | Obrigatório |
|---|---|---|
| `title` | string | ❌ |
| `short_description` | string | ❌ |
| `area` | string | ❌ |
| `event_date` | date | ❌ |
| `start_time` | string | ❌ |
| `shift` | string | ❌ |
| `total_slots` | int | ❌ |
| `banner` | file | ❌ |

---

#### `GET /events/`
Lista eventos ativos com filtros opcionais.

**Autenticação:** Não requerida

**Query Params:**

| Parâmetro | Tipo | Default | Descrição |
|---|---|---|---|
| `skip` | int | `0` | Paginação |
| `limit` | int | `20` | Máximo de registros |
| `area` | string | — | Filtrar por área acadêmica |
| `shift` | string | — | Filtrar por turno |

---

#### `GET /events/{event_id}`
Retorna detalhes completos de um evento.

**Autenticação:** Não requerida

---

#### `DELETE /events/{event_id}`
Remove ou desativa um evento.

**Autenticação:** ✅ Requerida — `admin` ou `staff`

**Resposta `200`:**
```json
{
  "status": "success",
  "message": "Evento removido/desativado com sucesso."
}
```

---

### Módulo de Inscrições (`/enrollments`)

#### `POST /enrollments/subscribe/{event_id}`
Inscreve o aluno logado em um evento.

**Autenticação:** ✅ Requerida — `student`, `staff` ou `admin`

**Validações realizadas automaticamente:**
- Evento deve existir
- Prazo de inscrição não pode ter expirado
- Deve haver vagas disponíveis
- Não pode haver conflito de horário com outro evento inscrito
- Não pode estar inscrito duas vezes no mesmo evento

**Resposta `200`:**
```json
{
  "id": 5,
  "user_id": 1,
  "event_id": 10,
  "qr_code_token": "uuid-token-gerado",
  "enrolled_at": "2025-01-10T14:30:00Z",
  "is_present": false,
  "present_at": null,
  "event_name": "Semana de TI 2025",
  "event_scheduled_date": "2025-10-15",
  "event_start_time": "08:00",
  "student_name": "João Silva",
  "student_code": "RA12345"
}
```

---

#### `GET /enrollments/my-subscriptions`
Lista todas as inscrições do aluno logado.

**Autenticação:** ✅ Requerida — `student`, `staff` ou `admin`

**Resposta `200`:** Array de `EnrollmentResponse`

---

#### `POST /enrollments/validate/{qr_token}`
Valida a presença do aluno via leitura do QR Code.

**Autenticação:** ✅ Requerida — `admin` ou `staff`

**Resposta `200`:**
```json
{
  "status": "success",
  "message": "Presença confirmada!",
  "user_id": 1
}
```

---

#### `POST /enrollments/manual-checkin/{enrollment_id}`
Realiza check-in manual por ID de inscrição (contingência quando o QR falha).

**Autenticação:** ✅ Requerida — `admin` ou `staff`

**Resposta `200`:**
```json
{
  "status": "success",
  "message": "Check-in manual realizado com sucesso para o inscrito 5!",
  "present_at": "2025-10-15T08:45:00Z"
}
```

---

#### `GET /enrollments/event/{event_id}/attendees`
Gera relatório consolidado de presença de um evento.

**Autenticação:** ✅ Requerida — `admin` ou `staff`

**Resposta `200`:**
```json
{
  "event_title": "Semana de TI 2025",
  "total_enrolled": 150,
  "total_present": 130,
  "attendees": [
    {
      "name": "João Silva",
      "registration": "RA12345",
      "area": "Computação",
      "is_present": true,
      "confirmed_at": "2025-10-15T08:45:00Z"
    }
  ]
}
```

---

### Módulo de Estágios (`/internships`)

#### `POST /internships/`
Publica uma nova vaga de estágio.

**Autenticação:** ✅ Requerida — `admin` ou `staff`

**Body:**
```json
{
  "company": "TechCorp Brasil",
  "position": "Estagiário de Backend",
  "description": "Desenvolvimento de APIs REST com Python e FastAPI. Conhecimento em bancos relacionais é desejável.",
  "location": "Remoto",
  "start_date": "2025-06-01T09:00:00",
  "end_date": "2025-12-31T18:00:00"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `company` | string | ✅ | Nome da empresa |
| `position` | string | ✅ | Título da vaga |
| `location` | string | ✅ | Cidade/UF ou "Remoto" |
| `start_date` | datetime (ISO 8601) | ✅ | Início da vaga |
| `description` | string | ❌ | Descrição detalhada |
| `end_date` | datetime (ISO 8601) | ❌ | Prazo para candidatura |

**Resposta `200`:**
```json
{
  "id": 1,
  "company": "TechCorp Brasil",
  "position": "Estagiário de Backend",
  "description": "Desenvolvimento de APIs REST...",
  "location": "Remoto",
  "start_date": "2025-06-01T09:00:00",
  "end_date": "2025-12-31T18:00:00"
}
```

---

#### `PUT /internships/{internship_id}`
Atualiza uma vaga existente.

**Autenticação:** ✅ Requerida — `admin` ou `staff`

**Body:** _(mesmo formato do POST)_

---

#### `DELETE /internships/{internship_id}`
Desativa (soft delete) uma vaga.

**Autenticação:** ✅ Requerida — `admin` ou `staff`

**Resposta `200`:**
```json
{
  "status": "success",
  "message": "Vaga desativada com sucesso."
}
```

---

#### `GET /internships/`
Lista vagas disponíveis com busca textual.

**Autenticação:** Não requerida

**Query Params:**

| Parâmetro | Tipo | Default | Descrição |
|---|---|---|---|
| `skip` | int | `0` | Paginação |
| `limit` | int | `10` | Máximo de registros |
| `search` | string | — | Busca por texto (cargo, empresa, descrição) |

---

#### `GET /internships/{internship_id}`
Detalhes de uma vaga específica.

**Autenticação:** Não requerida

---

### Módulo de Notícias (`/news`)

#### `GET /news/`
Lista comunicados ativos.

**Autenticação:** Não requerida

**Query Params:**

| Parâmetro | Tipo | Default |
|---|---|---|
| `skip` | int | `0` |
| `limit` | int | `5` |

---

#### `POST /news/`
Publica um novo comunicado.

**Autenticação:** ✅ Requerida — `admin` ou `staff`

**Body:**
```json
{
  "title": "Calendário Acadêmico 2025/2",
  "subject": "Institucional",
  "summary": "Confira as datas do segundo semestre letivo.",
  "content": "O calendário completo do segundo semestre foi publicado...",
  "author_id": "uuid-do-autor",
  "image_url": "https://exemplo.com/imagem.jpg",
  "attachments": [
    { "name": "Calendário PDF", "url": "https://exemplo.com/cal.pdf" }
  ],
  "visibility": {},
  "expires_at": "2025-12-31T23:59:59"
}
```

| Campo | Tipo | Obrigatório | Regra |
|---|---|---|---|
| `title` | string | ✅ | 5–200 caracteres |
| `summary` | string | ✅ | 10–255 caracteres |
| `content` | string | ✅ | Mín. 10 caracteres |
| `author_id` | string (UUID) | ✅ | ID do autor |
| `subject` | string | ❌ | Máx. 120 chars |
| `image_url` | string | ❌ | URL da imagem |
| `attachments` | array | ❌ | Lista de `{name, url}` |
| `visibility` | object | ❌ | Regras de visibilidade |
| `expires_at` | datetime | ❌ | Data de expiração |

---

#### `PATCH /news/{news_id}`
Atualiza um comunicado (suporta concorrência otimista via versão).

**Autenticação:** ✅ Requerida — `admin` ou autor da notícia

**Body:**
```json
{
  "title": "Título Atualizado",
  "summary": "Novo resumo da notícia.",
  "current_version": 1
}
```

> O campo `current_version` é obrigatório e deve corresponder à versão atual no banco. Se outro admin editou antes de você, a requisição retorna erro de concorrência.

---

#### `DELETE /news/{news_id}`
Remove um comunicado. Se já foi lido por alguém, faz soft delete. Caso contrário, remove fisicamente.

**Autenticação:** ✅ Requerida — `admin` ou `staff`

**Resposta `200`:**
```json
{
  "status": "success",
  "message": "Notícia removida."
}
```

---

### Módulo de Certificados (`/certificates`)

#### `GET /certificates/download/{enrollment_id}`
Gera e baixa o certificado de participação em PDF.

**Autenticação:** ✅ Requerida — `student`, `staff` ou `admin`

**Regras:**
- O usuário logado só pode baixar seus próprios certificados
- A presença no evento **deve estar confirmada** (is_present = true)

**Resposta `200`:**
- Content-Type: `application/pdf`
- Header: `Content-Disposition: attachment; filename=certificado_evento_{id}.pdf`

**Resposta `400`** (presença não confirmada):
```json
{
  "detail": "Certificado indisponível. Sua presença neste evento ainda não foi validada."
}
```

**Resposta `403`** (tentativa de acessar certificado de outro usuário):
```json
{
  "detail": "Acesso negado. Este certificado pertence a outro usuário."
}
```

---

### Módulo de Dashboard (`/student`)

#### `GET /student/dashboard`
Retorna visão consolidada personalizada para o aluno em uma única requisição.

**Autenticação:** ✅ Requerida (qualquer role)

**Resposta `200`:**
```json
{
  "my_enrollments": [
    {
      "id": 5,
      "event_name": "Semana de TI 2025",
      "event_scheduled_date": "2025-10-15",
      "event_start_time": "08:00",
      "is_present": false,
      "qr_code_token": "uuid-token"
    }
  ],
  "latest_news": [
    {
      "id": "uuid-news",
      "title": "Calendário 2025/2",
      "summary": "Confira as datas...",
      "created_at": "2025-01-01T10:00:00Z"
    }
  ],
  "recent_internships": [
    {
      "id": 1,
      "company": "TechCorp",
      "position": "Estagiário de Backend",
      "location": "Remoto"
    }
  ]
}
```

---

### Módulo de Administração (`/admin`)

#### `GET /admin/logs`
Exibe a trilha de auditoria completa de todas as ações críticas do sistema.

**Autenticação:** ✅ Requerida — `admin`

**Query Params:**

| Parâmetro | Tipo | Default |
|---|---|---|
| `skip` | int | `0` |
| `limit` | int | `50` |

**Resposta `200`:**
```json
[
  {
    "id": 1,
    "user_id": "1",
    "action": "CREATE_USER",
    "table_name": "users",
    "description": "Usuário registrado: RA12345 | joao@email.com (Role: student)",
    "timestamp": "2025-01-01T10:00:00"
  }
]
```

---

#### `GET /admin/users`
Lista todos os usuários com detalhes administrativos.

**Autenticação:** ✅ Requerida — `admin`

**Query Params:** `skip`, `limit`

---

#### `DELETE /admin/users/{user_id}`
Desativa um usuário por ordem administrativa.

**Autenticação:** ✅ Requerida — `admin`

**Resposta `200`:**
```json
{
  "status": "success",
  "message": "Usuário 5 desativado."
}
```

---

## Roles e Permissões (RBAC)

| Endpoint | `student` | `staff` | `admin` |
|---|:---:|:---:|:---:|
| Registrar / Login / Ativar OTP | ✅ | ✅ | ✅ |
| Ver e editar próprio perfil | ✅ | ✅ | ✅ |
| Listar eventos e estágios | ✅ | ✅ | ✅ |
| Inscrever-se em eventos | ✅ | ✅ | ✅ |
| Baixar próprio certificado | ✅ | ✅ | ✅ |
| Ver dashboard | ✅ | ✅ | ✅ |
| Criar/Editar eventos | ❌ | ✅ | ✅ |
| Validar presença (QR/Manual) | ❌ | ✅ | ✅ |
| Ver relatório de presença | ❌ | ✅ | ✅ |
| Publicar notícias e vagas | ❌ | ✅ | ✅ |
| Alterar role de usuários | ❌ | ❌ | ✅ |
| Ver logs de auditoria | ❌ | ❌ | ✅ |
| Deletar usuários | ❌ | ❌ | ✅ |

---

## Códigos de Erro Comuns

| Código | Situação |
|---|---|
| `400` | Dados inválidos, duplicidade (e-mail/matrícula), OTP incorreto |
| `401` | Token ausente, inválido, expirado ou conta inativa |
| `403` | Role sem permissão para o recurso ou tentativa de auto-deleção |
| `404` | Recurso não encontrado (usuário, evento, inscrição...) |
| `422` | Erro de validação do Pydantic (campos ausentes ou com tipo errado) |
| `500` | Erro interno — verifique os logs do servidor |

**Formato padrão de erro:**
```json
{
  "detail": "Mensagem descritiva do erro."
}
```

---

## Testes

O projeto inclui uma suíte de testes unitários com **pytest** e mocks.

### Instalação das dependências de teste

```bash
pip install -r requirements-test.txt
```

### Executar todos os testes

```bash
python -m pytest -W ignore
```

### Executar com relatório de cobertura

```bash
python -m pytest --cov=business --cov=core --cov-report=term-missing -W ignore
```

### Executar um arquivo específico

```bash
python -m pytest test/test_auth_service.py -v -W ignore
```

---

## Dicas de Desenvolvimento

### 1. Modo de simulação de e-mail
Se a `RESEND_API_KEY` não estiver configurada ou for inválida, os códigos OTP são exibidos diretamente no terminal (console). Isso facilita o desenvolvimento sem precisar de um domínio verificado.

```
📩📩📩📩📩📩📩📩📩📩📩📩📩📩📩
 MODO SIMULAÇÃO (E-mail não enviado via API)
 PARA: joao@email.com
 CÓDIGO: 482910
📩📩📩📩📩📩📩📩📩📩📩📩📩📩📩
```

### 2. Primeiro usuário sempre vira admin
O sistema detecta automaticamente se o banco está vazio. Ao registrar o primeiro usuário, ele recebe `role: admin` e conta ativa sem precisar de OTP. Use isso para criar a conta de administrador inicial.

### 3. Debug de SQL
Para ver todas as queries SQL executadas, altere no `database.py`:
```python
engine = create_engine(settings.DATABASE_URL, echo=True)  # echo=False em produção
```

### 4. Renovação de token após mudança de role
Se um admin alterar a role de um usuário logado, o token JWT desse usuário é automaticamente invalidado na próxima requisição. O sistema exige novo login — isso é um comportamento de segurança intencional.

### 5. Arquivos estáticos
Banners de eventos são salvos em `static/banners/` com nomes UUID gerados automaticamente. O diretório é criado na inicialização da aplicação. Acesse os arquivos via:
```
http://127.0.0.1:8000/static/banners/nome-do-arquivo.jpg
```

### 6. Limite de senha (72 caracteres)
Por design do algoritmo Argon2, senhas acima de 72 caracteres são truncadas automaticamente. Isso previne ataques DoS via senhas muito longas.

### 7. Soft Delete vs Delete Físico
O sistema usa soft delete em usuários e vagas de estágio (campo `is_active = false`). Notícias são deletadas fisicamente apenas se não tiverem sido lidas por nenhum usuário — caso contrário, também recebem soft delete para preservar a rastreabilidade.

## Licença

Este software é um produto comercial e proprietário.

O uso, cópia, modificação, fusão, publicação, distribuição, sublicenciamento ou venda de cópias deste software é estritamente proibido sem a autorização prévia por escrito do proprietário dos direitos autorais.

- O código-fonte é confidencial e para uso exclusivamente interno.
- Nenhuma parte deste projeto pode ser reproduzida ou transmitida de qualquer forma ou por qualquer meio.
- A violação destes termos estará sujeita às penalidades previstas na legislação de propriedade intelectual e direitos autorais.
