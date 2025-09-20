import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/models/User';
import { testConnection } from '@/lib/database';
import jwt from 'jsonwebtoken';

// Função para normalizar telefone australiano
function normalizeAustralianPhone(phone: string): string {
  // Remove espaços, hífens, parênteses e outros caracteres especiais
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  
  // Se já começa com +61, retorna como está
  if (cleanPhone.startsWith('+61')) {
    return cleanPhone;
  }
  
  // Se começa com 61, adiciona o +
  if (cleanPhone.startsWith('61') && cleanPhone.length === 11) {
    return '+' + cleanPhone;
  }
  
  // Se é um número local australiano (9 dígitos), adiciona +61
  if (cleanPhone.length === 9 && /^[0-9]+$/.test(cleanPhone)) {
    return '+61' + cleanPhone;
  }
  
  // Se começa com 0 (formato nacional), remove o 0 e adiciona +61
  if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
    return '+61' + cleanPhone.substring(1);
  }
  
  return cleanPhone;
}

// Função para validar telefone australiano
function isValidAustralianPhone(phone: string): boolean {
  const normalizedPhone = normalizeAustralianPhone(phone);
  // Verifica se está no formato correto após normalização
  const phoneRegex = /^\+61[0-9]{9}$/;
  return phoneRegex.test(normalizedPhone);
}

// Interface para o payload do JWT
interface JWTPayload {
  userId: number;
  email: string;
  iat: number;
  exp: number;
}

// Função para verificar e decodificar o token JWT
function verifyToken(token: string): JWTPayload | null {
  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    return null;
  }
}

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

export async function GET(request: NextRequest) {
  try {
    // Verificar conexão com o banco
    const isConnected = await testConnection();
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Erro de conexão com o banco de dados' },
        { status: 500 }
      );
    }

    // Extrair e verificar token
    const token = extractToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Token de autenticação não encontrado' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    // Buscar dados do usuário
    const user = await UserModel.findById(payload.userId);

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Retornar dados do usuário (senha já não está incluída na interface User)
    return NextResponse.json({
      success: true,
      user: user
    });

  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Conectar ao banco de dados
    await testConnection();

    // Extrair e verificar token
    const token = extractToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Token de acesso não fornecido' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    // Obter dados do corpo da requisição
    const body = await request.json();
    const { full_name, phone, rate } = body;

    // Validar campos obrigatórios
    if (!full_name || !phone || !rate) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar telefone
    if (!isValidAustralianPhone(phone)) {
      return NextResponse.json(
        { 
          error: 'Telefone inválido',
          details: 'Use um formato válido para telefones australianos'
        },
        { status: 400 }
      );
    }

    // Validar formato da taxa
    const rateNumber = parseFloat(rate);
    if (isNaN(rateNumber) || rateNumber < 0) {
      return NextResponse.json(
        { error: 'Taxa deve ser um número válido' },
        { status: 400 }
      );
    }

    // Atualizar dados do usuário
    const updatedUser = await UserModel.updateProfile(payload.userId, {
      full_name,
      phone: normalizeAustralianPhone(phone), // Normaliza o telefone
      rate: rateNumber.toString()
    });

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Dados atualizados com sucesso',
      user: updatedUser
    });

  } catch (error) {
    console.error('Erro ao atualizar dados do usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}