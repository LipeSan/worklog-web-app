-- Migração para melhorar o campo de telefone
-- Execute este script no seu banco Neon

-- 1. Aumentar o tamanho do campo phone para suportar diferentes formatos
ALTER TABLE users ALTER COLUMN phone TYPE VARCHAR(30);

-- 2. Adicionar comentário explicativo
COMMENT ON COLUMN users.phone IS 'Telefone no formato +61XXXXXXXXX (internacional) ou XXXXXXXXX (local australiano)';

-- 3. Criar função para normalizar telefone australiano
CREATE OR REPLACE FUNCTION normalize_australian_phone(phone_input TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Remove espaços, hífens, parênteses e outros caracteres especiais
    phone_input := REGEXP_REPLACE(phone_input, '[^0-9+]', '', 'g');
    
    -- Se já começa com +61, retorna como está
    IF phone_input LIKE '+61%' THEN
        RETURN phone_input;
    END IF;
    
    -- Se começa com 61, adiciona o +
    IF phone_input LIKE '61%' AND LENGTH(phone_input) = 11 THEN
        RETURN '+' || phone_input;
    END IF;
    
    -- Se é um número local australiano (9 dígitos), adiciona +61
    IF LENGTH(phone_input) = 9 AND phone_input ~ '^[0-9]+$' THEN
        RETURN '+61' || phone_input;
    END IF;
    
    -- Se começa com 0 (formato nacional), remove o 0 e adiciona +61
    IF phone_input LIKE '0%' AND LENGTH(phone_input) = 10 THEN
        RETURN '+61' || SUBSTRING(phone_input FROM 2);
    END IF;
    
    -- Retorna como está se não conseguir normalizar
    RETURN phone_input;
END;
$$ LANGUAGE plpgsql;

-- 4. Criar função para formatar telefone para exibição
CREATE OR REPLACE FUNCTION format_australian_phone_display(phone_input TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Normaliza primeiro
    phone_input := normalize_australian_phone(phone_input);
    
    -- Se é um telefone australiano válido (+61XXXXXXXXX)
    IF phone_input ~ '^\+61[0-9]{9}$' THEN
        -- Remove +61 e formata como XXX XXX XXX
        DECLARE
            local_number TEXT := SUBSTRING(phone_input FROM 4);
        BEGIN
            RETURN SUBSTRING(local_number FROM 1 FOR 3) || ' ' || 
                   SUBSTRING(local_number FROM 4 FOR 3) || ' ' || 
                   SUBSTRING(local_number FROM 7 FOR 3);
        END;
    END IF;
    
    -- Retorna como está se não conseguir formatar
    RETURN phone_input;
END;
$$ LANGUAGE plpgsql;

-- 5. Atualizar telefones existentes para o formato normalizado
UPDATE users 
SET phone = normalize_australian_phone(phone)
WHERE phone IS NOT NULL AND phone != '';

-- 6. Criar constraint para validar formato do telefone
ALTER TABLE users 
ADD CONSTRAINT check_phone_format 
CHECK (
    phone IS NULL OR 
    phone = '' OR 
    phone ~ '^\+61[0-9]{9}$' OR  -- Formato internacional completo
    phone ~ '^[0-9]{9}$'         -- Formato local (será normalizado pela aplicação)
);

-- 7. Criar índice para busca por telefone (se não existir)
DROP INDEX IF EXISTS idx_users_phone;
CREATE INDEX idx_users_phone ON users(phone) WHERE phone IS NOT NULL AND phone != '';

-- 8. Adicionar função para validar telefone australiano
CREATE OR REPLACE FUNCTION is_valid_australian_phone(phone_input TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Normaliza o telefone
    phone_input := normalize_australian_phone(phone_input);
    
    -- Verifica se está no formato correto
    RETURN phone_input ~ '^\+61[0-9]{9}$';
END;
$$ LANGUAGE plpgsql;

-- Comentários sobre as mudanças
COMMENT ON FUNCTION normalize_australian_phone(TEXT) IS 'Normaliza telefone australiano para formato +61XXXXXXXXX';
COMMENT ON FUNCTION format_australian_phone_display(TEXT) IS 'Formata telefone australiano para exibição como XXX XXX XXX';
COMMENT ON FUNCTION is_valid_australian_phone(TEXT) IS 'Valida se o telefone está no formato australiano correto';