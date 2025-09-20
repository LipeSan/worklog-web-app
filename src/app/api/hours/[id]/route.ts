import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface HoursData {
  date: string;
  project: string;
  startTime: string;
  endTime: string;
  hours: number;
  description?: string;
}

// Função para validar os dados de entrada
function validateHoursData(data: HoursData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.date) {
    errors.push('Data é obrigatória');
  } else {
    const date = new Date(data.date);
    if (isNaN(date.getTime())) {
      errors.push('Data inválida');
    }
  }

  if (!data.project || typeof data.project !== 'string' || data.project.trim().length === 0) {
    errors.push('Nome do projeto é obrigatório');
  }

  if (!data.startTime || typeof data.startTime !== 'string') {
    errors.push('Horário de início é obrigatório');
  }

  if (!data.endTime || typeof data.endTime !== 'string') {
    errors.push('Horário de fim é obrigatório');
  }

  if (typeof data.hours !== 'number' || data.hours <= 0) {
    errors.push('Número de horas deve ser maior que zero');
  }

  // Validar se o horário de fim é maior que o de início
  if (data.startTime && data.endTime) {
    const start = new Date(`2000-01-01T${data.startTime}:00`);
    const end = new Date(`2000-01-01T${data.endTime}:00`);
    
    if (end <= start) {
      errors.push('Horário de fim deve ser maior que o horário de início');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function calculateHours(startTime: string, endTime: string): number {
  const start = new Date(`2000-01-01T${startTime}:00`);
  const end = new Date(`2000-01-01T${endTime}:00`);
  
  const diffMs = end.getTime() - start.getTime();
  return diffMs / (1000 * 60 * 60); // Converter para horas
}

// API para atualizar um registro de horas específico
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de acesso não fornecido' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verificar e decodificar o token
    let decoded: { userId: number };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    } catch (error) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const hoursId = parseInt(id);
    if (isNaN(hoursId)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Verificar se o registro existe e pertence ao usuário
    const existingRecord = await query(
      'SELECT id, user_id FROM work_hours WHERE id = $1',
      [hoursId]
    );

    if (existingRecord.rows.length === 0) {
      return NextResponse.json(
        { error: 'Registro não encontrado' },
        { status: 404 }
      );
    }

    if (existingRecord.rows[0].user_id !== decoded.userId) {
      return NextResponse.json(
        { error: 'Não autorizado a editar este registro' },
        { status: 403 }
      );
    }

    // Obter dados do corpo da requisição
    const body = await request.json();
    const hoursData: HoursData = {
      date: body.date,
      project: body.project,
      startTime: body.startTime,
      endTime: body.endTime,
      hours: body.hours,
      description: body.description
    };

    // Validar dados
    const validation = validateHoursData(hoursData);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.errors },
        { status: 400 }
      );
    }

    // Sempre calcular horas automaticamente baseado nos horários
    const calculatedHours = calculateHours(hoursData.startTime, hoursData.endTime);

    // Obter taxa horária do usuário
    const userResult = await query(
      'SELECT rate FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const hourlyRate = parseFloat(userResult.rows[0].rate) || 0;

    // Atualizar registro (total_amount é calculado automaticamente pelo banco)
    const result = await query(
      `UPDATE work_hours 
       SET project_name = $1, work_date = $2, start_time = $3, end_time = $4, 
           total_hours = $5, hourly_rate = $6, description = $7,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND user_id = $9
       RETURNING id, project_name, work_date, start_time, end_time, total_hours, 
                 hourly_rate, total_amount, description, created_at, updated_at`,
      [
        hoursData.project.trim(),
        hoursData.date,
        hoursData.startTime,
        hoursData.endTime,
        calculatedHours,
        hourlyRate,
        hoursData.description || null,
        hoursId,
        decoded.userId
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Falha ao atualizar registro' },
        { status: 500 }
      );
    }

    const updatedRecord = result.rows[0];

    return NextResponse.json({
      message: 'Registro atualizado com sucesso',
      hours: {
        id: updatedRecord.id,
        project: updatedRecord.project_name,
        date: updatedRecord.work_date,
        startTime: updatedRecord.start_time,
        endTime: updatedRecord.end_time,
        hours: parseFloat(updatedRecord.total_hours),
        rate: `$ ${parseFloat(updatedRecord.hourly_rate).toFixed(2)}`,
        total: `$ ${parseFloat(updatedRecord.total_amount).toFixed(2)}`,
        description: updatedRecord.description,
        createdAt: updatedRecord.created_at,
        updatedAt: updatedRecord.updated_at
      }
    });

  } catch (error) {
    console.error('Erro ao atualizar horas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// API para deletar um registro de horas específico
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de acesso não fornecido' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verificar e decodificar o token
    let decoded: { userId: number };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    } catch (error) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const hoursId = parseInt(id);
    if (isNaN(hoursId)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Verificar se o registro existe e pertence ao usuário
    const existingRecord = await query(
      'SELECT id, user_id, project_name FROM work_hours WHERE id = $1',
      [hoursId]
    );

    if (existingRecord.rows.length === 0) {
      return NextResponse.json(
        { error: 'Registro não encontrado' },
        { status: 404 }
      );
    }

    if (existingRecord.rows[0].user_id !== decoded.userId) {
      return NextResponse.json(
        { error: 'Não autorizado a deletar este registro' },
        { status: 403 }
      );
    }

    // Deletar registro
    const result = await query(
      'DELETE FROM work_hours WHERE id = $1 AND user_id = $2 RETURNING id',
      [hoursId, decoded.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Falha ao deletar registro' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Registro deletado com sucesso',
      deletedId: hoursId
    });

  } catch (error) {
    console.error('Erro ao deletar horas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}