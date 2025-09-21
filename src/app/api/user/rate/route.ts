import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/models/User';

interface UpdateRateData {
  userId: number;
  rate: number;
}

export async function PUT(request: NextRequest) {
  try {
    const body: UpdateRateData = await request.json();
    const { userId, rate } = body;

    // Validações
    if (!userId || typeof userId !== 'number') {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!rate || typeof rate !== 'number' || rate < 0) {
      return NextResponse.json(
        { error: 'Rate deve ser um número positivo' },
        { status: 400 }
      );
    }

    // Atualizar rate no banco
    const updatedUser = await UserModel.updateRate(userId, rate);

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Resposta de sucesso
    return NextResponse.json(
      {
        message: 'Rate atualizado com sucesso',
        user: {
          id: updatedUser.id,
          fullName: updatedUser.full_name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          rate: updatedUser.rate,
          updatedAt: updatedUser.updated_at
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error updating rate:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: 'Please try again later'
      },
      { status: 500 }
    );
  }
}

// Endpoint para buscar rate atual do usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const user = await UserModel.findById(parseInt(userId));

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        rate: user.rate,
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          phone: user.phone,
          rate: user.rate
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error fetching rate:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: 'Please try again later'
      },
      { status: 500 }
    );
  }
}