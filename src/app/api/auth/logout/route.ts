import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Criar resposta de sucesso
    const response = NextResponse.json(
      {
        message: 'Logout successful'
      },
      { status: 200 }
    );

    // Remover o cookie de autenticação
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expira imediatamente
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: 'Error processing logout'
      },
      { status: 500 }
    );
  }
}

// Método GET para verificar se a API está funcionando
export async function GET() {
  return NextResponse.json({
    message: 'Logout API working',
    endpoint: '/api/auth/logout',
    methods: ['POST']
  }, { status: 200 });
}