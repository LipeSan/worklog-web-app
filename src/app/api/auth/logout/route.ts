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
      secure: false, // Forçar false em desenvolvimento para compatibilidade com Safari
      sameSite: 'lax',
      maxAge: 0, // Expira imediatamente
      path: '/',
      domain: undefined // Não definir domain para localhost
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