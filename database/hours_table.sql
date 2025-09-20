-- Schema para tabela de horas trabalhadas
-- Execute este script no seu banco Neon após criar a tabela de usuários

CREATE TABLE IF NOT EXISTS work_hours (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    work_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_hours DECIMAL(4,2) NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) GENERATED ALWAYS AS (total_hours * hourly_rate) STORED,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_work_hours_user_id ON work_hours(user_id);
CREATE INDEX IF NOT EXISTS idx_work_hours_work_date ON work_hours(work_date);
CREATE INDEX IF NOT EXISTS idx_work_hours_project_name ON work_hours(project_name);
CREATE INDEX IF NOT EXISTS idx_work_hours_created_at ON work_hours(created_at);

-- Índice composto para consultas por usuário e data
CREATE INDEX IF NOT EXISTS idx_work_hours_user_date ON work_hours(user_id, work_date);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_work_hours_updated_at 
    BEFORE UPDATE ON work_hours 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Constraint para garantir que end_time seja maior que start_time
ALTER TABLE work_hours 
ADD CONSTRAINT check_time_order 
CHECK (end_time > start_time);

-- Constraint para garantir que total_hours seja positivo
ALTER TABLE work_hours 
ADD CONSTRAINT check_positive_hours 
CHECK (total_hours > 0);

-- Constraint para garantir que hourly_rate seja positivo
ALTER TABLE work_hours 
ADD CONSTRAINT check_positive_rate 
CHECK (hourly_rate > 0);