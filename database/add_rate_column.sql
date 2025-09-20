-- Migração para adicionar coluna rate à tabela users
-- Execute este script no Neon para adicionar a coluna rate aos usuários existentes

-- Adicionar coluna rate com valor padrão de 25.00
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS rate DECIMAL(10,2) DEFAULT 25.00 NOT NULL;

-- Atualizar usuários existentes que não têm rate definido
UPDATE users 
SET rate = 25.00 
WHERE rate IS NULL;

-- Verificar se a coluna foi adicionada corretamente
SELECT id, full_name, email, rate, created_at 
FROM users 
ORDER BY id;