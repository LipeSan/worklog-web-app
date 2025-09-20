import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Criar resposta de sucesso
    const response = NextResponse.json(
      {
        message: 'Logout realizado com sucesso'
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
    console.error('Erro no logout:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: 'Tente novamente mais tarde'
      },
      { status: 500 }
    );
  }
}

// Método GET para verificar se a API está funcionando
export async function GET() {
  return NextResponse.json(
    { 
      message: 'API de logout funcionando',
      endpoint: '/api/auth/logout',
      methods: ['POST']
    },
    { status: 200 }
  );
}