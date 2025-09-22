import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/models/User';
import { testConnection } from '@/lib/database';
import jwt from 'jsonwebtoken';

// Interface para os dados de login
interface LoginData {
  email: string;
  password: string;
  remember?: boolean;
}

// Função para validar email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Função para gerar JWT token
function generateToken(userId: number, email: string, remember: boolean = false): string {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  const expirationTime = remember 
    ? (30 * 24 * 60 * 60) // 30 dias se lembrar
    : (24 * 60 * 60); // 24 horas se não lembrar
  
  return jwt.sign(
    { 
      userId, 
      email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expirationTime
    },
    secret
  );
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginData = await request.json();
    const { email, password, remember = false } = body;

    // Validação dos campos obrigatórios
    if (!email || !password) {
      return NextResponse.json(
        {
          error: 'Email and password are required',
          details: 'Both fields must be filled'
        },
        { status: 400 }
      );
    }

    // Validação do email
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email' },
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
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verificar senha
    const isPasswordValid = await UserModel.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Gerar token JWT
    const token = generateToken(user.id, user.email, remember);

    // Resposta de sucesso
    const response = NextResponse.json(
      {
        message: 'Login successful',
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
    const cookieMaxAge = remember 
      ? 30 * 24 * 60 * 60 // 30 dias se lembrar (em segundos)
      : 24 * 60 * 60; // 24 horas se não lembrar (em segundos)
    
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: false, // Forçar false em desenvolvimento para compatibilidade com Safari
      sameSite: 'lax',
      maxAge: cookieMaxAge,
      path: '/',
      domain: undefined // Não definir domain para localhost
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: 'Error processing login'
      },
      { status: 500 }
    );
  }
}

// Método GET para verificar se a API está funcionando
export async function GET() {
  return NextResponse.json(
    { 
      message: 'Login API working',
      endpoint: '/api/auth/login',
      methods: ['POST']
    },
    { status: 200 }
  );
}