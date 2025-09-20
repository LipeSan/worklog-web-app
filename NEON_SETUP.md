# Configuração do Banco de Dados Neon

## Passos para configurar o Neon

### 1. Criar conta no Neon
1. Acesse [neon.tech](https://neon.tech)
2. Crie uma conta gratuita
3. Crie um novo projeto

### 2. Obter string de conexão
1. No painel do Neon, vá para "Connection Details"
2. Copie a string de conexão PostgreSQL
3. Ela terá o formato: `postgresql://username:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`

### 3. Configurar variáveis de ambiente
1. Copie o arquivo `.env.example` para `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edite o arquivo `.env.local` e substitua:
   - `DATABASE_URL`: Cole sua string de conexão do Neon
   - `JWT_SECRET`: Gere uma chave secreta segura

### 4. Executar o schema SQL
1. No painel do Neon, vá para "SQL Editor"
2. Execute o conteúdo do arquivo `database/schema.sql`
3. Isso criará a tabela `users` e os índices necessários

### 5. Testar a conexão
1. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Teste o registro de usuário:
   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "fullName": "Teste Usuario",
       "email": "teste@exemplo.com",
       "phone": "+61987654321",
       "password": "MinhaSenh@123"
     }'
   ```

## Estrutura do Banco

### Tabela `users`
- `id`: SERIAL PRIMARY KEY
- `full_name`: VARCHAR(255) NOT NULL
- `email`: VARCHAR(255) UNIQUE NOT NULL
- `phone`: VARCHAR(20) NOT NULL
- `password_hash`: VARCHAR(255) NOT NULL
- `created_at`: TIMESTAMP WITH TIME ZONE
- `updated_at`: TIMESTAMP WITH TIME ZONE
- `is_active`: BOOLEAN DEFAULT true

### Índices
- `idx_users_email`: Índice no campo email
- `idx_users_phone`: Índice no campo phone
- `idx_users_created_at`: Índice no campo created_at

## Funcionalidades Implementadas

✅ Conexão com Neon PostgreSQL
✅ Modelo de usuário com operações CRUD
✅ Hash seguro de senhas com bcrypt
✅ Validação de email único
✅ API de registro integrada
✅ Tratamento de erros de banco
✅ Pool de conexões otimizado