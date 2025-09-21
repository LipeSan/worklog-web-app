import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/database';
import { HoursData } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Função para validar os dados de entrada
function validateHoursData(data: HoursData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.date) {
    errors.push('Date is required');
  } else {
    const date = new Date(data.date);
    if (isNaN(date.getTime())) {
      errors.push('Invalid date');
    }
  }

  if (!data.project || typeof data.project !== 'string' || data.project.trim().length === 0) {
    errors.push('Project name is required');
  }

  if (!data.startTime || typeof data.startTime !== 'string') {
    errors.push('Start time is required');
  }

  if (!data.endTime || typeof data.endTime !== 'string') {
    errors.push('End time is required');
  }

  if (typeof data.hours !== 'number' || data.hours <= 0) {
    errors.push('Number of hours must be greater than zero');
  }

  // Validate if end time is greater than start time
  if (data.startTime && data.endTime) {
    const start = new Date(`2000-01-01T${data.startTime}:00`);
    const end = new Date(`2000-01-01T${data.endTime}:00`);
    
    if (end <= start) {
      errors.push('End time must be greater than start time');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Função para calcular horas baseado nos horários
function calculateHours(startTime: string, endTime: string): number {
  const start = new Date(`2000-01-01T${startTime}:00`);
  const end = new Date(`2000-01-01T${endTime}:00`);
  
  const diffMs = end.getTime() - start.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  return Math.round(diffHours * 100) / 100; // Round to 2 decimal places
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Access token not provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify and decode token
    let decoded: { userId: number };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get request body data
    const body = await request.json();
    
    // Validate data
    const validation = validateHoursData(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.errors },
        { status: 400 }
      );
    }

    // Always calculate hours automatically based on times
    const calculatedHours = calculateHours(body.startTime, body.endTime);
    
    // Get user hourly rate
    const userResult = await query(
      'SELECT rate FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userRate = parseFloat(userResult.rows[0].rate);

    // Insert hours record in database
    const insertResult = await query(
      `INSERT INTO work_hours 
       (user_id, project_name, work_date, start_time, end_time, total_hours, hourly_rate, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, user_id, project_name, work_date, start_time, end_time, total_hours, hourly_rate, total_amount, description, created_at`,
      [
        decoded.userId,
        body.project.trim(),
        body.date,
        body.startTime,
        body.endTime,
        calculatedHours,
        userRate,
        body.description || null
      ]
    );

    const newRecord = insertResult.rows[0];

    return NextResponse.json({
      message: 'Hours registered successfully',
      data: {
        id: newRecord.id,
        userId: newRecord.user_id,
        project: newRecord.project_name,
        date: newRecord.work_date,
        startTime: newRecord.start_time,
        endTime: newRecord.end_time,
        hours: parseFloat(newRecord.total_hours),
        hourlyRate: parseFloat(newRecord.hourly_rate),
        totalAmount: parseFloat(newRecord.total_amount),
        description: newRecord.description,
        createdAt: newRecord.created_at
      }
    });

  } catch (error) {
    console.error('Error registering hours:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// API to list user hours
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer '))if (!token) {
      return NextResponse.json(
        { error: 'Access token not provided' },
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

    // Obter parâmetros de consulta
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const project = searchParams.get('project');

    // Construir query dinâmica
    const whereConditions = ['user_id = $1'];
    const queryParams: (string | number)[] = [decoded.userId];
    let paramIndex = 2;

    if (startDate) {
      whereConditions.push(`work_date >= $${paramIndex}`);
      queryParams.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereConditions.push(`work_date <= $${paramIndex}`);
      queryParams.push(endDate);
      paramIndex++;
    }

    if (project) {
      whereConditions.push(`project_name ILIKE $${paramIndex}`);
      queryParams.push(`%${project}%`);
      paramIndex++;
    }

    // Adicionar limit e offset
    queryParams.push(limit, offset);

    const hoursResult = await query(
      `SELECT id, project_name, work_date, start_time, end_time, total_hours, hourly_rate, total_amount, description, created_at
       FROM work_hours 
       WHERE ${whereConditions.join(' AND ')}
       ORDER BY work_date DESC, created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      queryParams
    );

    // Contar total de registros
    const countResult = await query(
      `SELECT COUNT(*) as total FROM work_hours WHERE ${whereConditions.join(' AND ')}`,
      queryParams.slice(0, -2) // Remove limit e offset
    );

    const hours = hoursResult.rows.map(row => ({
      id: row.id,
      project: row.project_name,
      date: row.work_date,
      startTime: row.start_time,
      endTime: row.end_time,
      hours: parseFloat(row.total_hours),
      rate: `$ ${parseFloat(row.hourly_rate).toFixed(2)}`,
        total: `$ ${parseFloat(row.total_amount).toFixed(2)}`,
      description: row.description
    }));

    // Calcular summary
    const totalHours = hours.reduce((sum, hour) => sum + hour.hours, 0);
    const totalAmount = hoursResult.rows.reduce((sum, row) => sum + parseFloat(row.total_amount), 0);

    return NextResponse.json({
      hours: hours,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        page: Math.floor(offset / limit) + 1,
        limit,
        totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit)
      },
      summary: {
        totalHours: totalHours,
        totalAmount: totalAmount
      }
    });

  } catch (error) {
    console.error('Error fetching hours:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}