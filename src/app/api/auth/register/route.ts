import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/models/User';
import { testConnection } from '@/lib/database';

// Interface para os dados de registro
interface RegisterData {
  fullName: string;
  phone: string;
  email: string;
  password: string;
}

// Função para validar email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

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

// Função para validar senha
function isValidPassword(password: string): boolean {
  // Mínimo 8 caracteres, pelo menos 1 letra e 1 número
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
  return passwordRegex.test(password);
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterData = await request.json();
    const { fullName, phone, email, password } = body;

    // Validação dos campos obrigatórios
    if (!fullName || !phone || !email || !password) {
      return NextResponse.json(
        { 
          error: 'Incomplete data',
          details: 'fullName, phone, email and password are required'
        },
        { status: 400 }
      );
    }

    // Validação do nome completo
    if (!fullName || fullName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Full name must be at least 2 characters' },
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

    // Validação do telefone
    if (!isValidAustralianPhone(phone)) {
      return NextResponse.json(
        {
          error: 'Invalid phone number',
          details: 'Use the format +61XXXXXXXXX for Australian phones'
        },
        { status: 400 }
      );
    }

    // Validação da senha
    if (!isValidPassword(password)) {
      return NextResponse.json(
        {
          error: 'Invalid password',
          details: 'Password must be at least 8 characters, including letters and numbers'
        },
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

    // Verificar se o email já existe
    const emailExists = await UserModel.emailExists(email.toLowerCase().trim());
    if (emailExists) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Dados do usuário para salvar
    const userData = {
      full_name: fullName.trim(),
      phone: normalizeAustralianPhone(phone), // Normaliza o telefone
      email: email.toLowerCase().trim(),
      password: password
    };

    // Salvar no banco de dados
    const savedUser = await UserModel.create(userData);

    // Resposta de sucesso
    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: savedUser.id,
          name: savedUser.full_name,
          email: savedUser.email,
          phone: savedUser.phone
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: 'Error creating user'
      },
      { status: 500 }
    );
  }
}

// Método GET para verificar se a API está funcionando
export async function GET() {
  return NextResponse.json(
    { 
      message: 'Registration API working',
      endpoint: '/api/auth/register',
      methods: ['POST']
    },
    { status: 200 }
  );
}