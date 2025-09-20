import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/models/User';
import { testConnection } from '@/lib/database';
import jwt from 'jsonwebtoken';

// Interface para os dados de login
interface LoginData {
  email: string;
  password: string;
}

// Função para validar email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Função para gerar JWT token
function generateToken(userId: number, email: string): string {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  return jwt.sign(
    { 
      userId, 
      email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
    },
    secret
  );
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginData = await request.json();
    const { email, password } = body;

    // Validação dos campos obrigatórios
    if (!email || !password) {
      return NextResponse.json(
        { 
          error: 'Email e senha são obrigatórios',
          details: 'Preencha todos os campos'
        },
        { status: 400 }
      );
    }

    // Validação do email
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Testar conexão com banco de dados
    const dbConnected = await testConnection();
    if (!dbConnected) {
      return NextResponse.json(
        { error: 'Erro de conexão com banco de dados' },
        { status: 503 }
      );
    }

    // Buscar usuário por email
    const user = await UserModel.findByEmail(email.toLowerCase().trim());
    if (!user) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // Verificar senha
    const isPasswordValid = await UserModel.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // Gerar token JWT
    const token = generateToken(user.id, user.email);

    // Resposta de sucesso
    const response = NextResponse.json(
      {
        message: 'Login realizado com sucesso',
        token: token,
        user: {
          id: user.id,
          name: user.full_name, // Mudando para 'name' para compatibilidade com AuthContext
          email: user.email,
          phone: user.phone,
          rate: user.rate,
          createdAt: user.created_at
        }
      },
      { status: 200 }
    );

    // Definir cookie com o token (httpOnly para segurança)
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Erro no login:', error);
    
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
      message: 'API de login funcionando',
      endpoint: '/api/auth/login',
      methods: ['POST']
    },
    { status: 200 }
  );
}