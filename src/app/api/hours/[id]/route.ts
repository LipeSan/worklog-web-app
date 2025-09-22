import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/database';
import { HoursData } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Função para extrair token do cookie ou header
function extractToken(request: NextRequest): string | null {
  // Primeiro tenta pegar do cookie
  const cookieToken = request.cookies.get('auth-token')?.value;
  if (cookieToken) {
    return cookieToken;
  }

  // Se não encontrar no cookie, tenta no header Authorization
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

// Function to validate input data
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

function calculateHours(startTime: string, endTime: string): number {
  const start = new Date(`2000-01-01T${startTime}:00`);
  const end = new Date(`2000-01-01T${endTime}:00`);
  
  const diffMs = end.getTime() - start.getTime();
  return diffMs / (1000 * 60 * 60); // Convert to hours
}

// API to update a specific hours record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const token = extractToken(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication token not found' },
        { status: 401 }
      );
    }

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

    const { id } = await params;
    const hoursId = parseInt(id);
    if (isNaN(hoursId)) {
      return NextResponse.json(
        { error: 'Invalid ID' },
        { status: 400 }
      );
    }

    // Check if record exists and belongs to user
    const existingRecord = await query(
      'SELECT id, user_id FROM work_hours WHERE id = $1',
      [hoursId]
    );

    if (existingRecord.rows.length === 0) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }

    if (existingRecord.rows[0].user_id !== decoded.userId) {
      return NextResponse.json(
        { error: 'Not authorized to edit this record' },
        { status: 403 }
      );
    }

    // Get request body data
    const body = await request.json();
    const hoursData: HoursData = {
      date: body.date,
      project: body.project,
      startTime: body.startTime,
      endTime: body.endTime,
      hours: body.hours,
      description: body.description
    };

    // Validate data
    const validation = validateHoursData(hoursData);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.errors },
        { status: 400 }
      );
    }

    // Always calculate hours automatically based on times
    const calculatedHours = calculateHours(hoursData.startTime, hoursData.endTime);

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

    const hourlyRate = parseFloat(userResult.rows[0].rate) || 0;

    // Update record (total_amount is calculated automatically by database)
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
        { error: 'Failed to update record' },
        { status: 500 }
      );
    }

    const updatedRecord = result.rows[0];

    return NextResponse.json({
      message: 'Record updated successfully',
      hours: {
        id: updatedRecord.id,
        project: updatedRecord.project_name,
        date: updatedRecord.work_date,
        startTime: updatedRecord.start_time,
        endTime: updatedRecord.end_time,
        hours: parseFloat(updatedRecord.total_hours),
        rate: `${parseFloat(updatedRecord.hourly_rate).toFixed(2)}`,
        total: `${parseFloat(updatedRecord.total_amount).toFixed(2)}`,
        description: updatedRecord.description,
        createdAt: updatedRecord.created_at,
        updatedAt: updatedRecord.updated_at
      }
    });

  } catch (error) {
    console.error('Error updating hours:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// API to delete a specific hours record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const token = extractToken(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication token not found' },
        { status: 401 }
      );
    }

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

    const { id } = await params;
    const hoursId = parseInt(id);
    if (isNaN(hoursId)) {
      return NextResponse.json(
        { error: 'Invalid ID' },
        { status: 400 }
      );
    }

    // Check if record exists and belongs to user
    const existingRecord = await query(
      'SELECT id, user_id, project_name FROM work_hours WHERE id = $1',
      [hoursId]
    );

    if (existingRecord.rows.length === 0) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }

    if (existingRecord.rows[0].user_id !== decoded.userId) {
      return NextResponse.json(
        { error: 'Not authorized to delete this record' },
        { status: 403 }
      );
    }

    // Delete record
    const result = await query(
      'DELETE FROM work_hours WHERE id = $1 AND user_id = $2 RETURNING id',
      [hoursId, decoded.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Record deleted successfully',
      deletedId: hoursId
    });

  } catch (error) {
    console.error('Error deleting hours:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}