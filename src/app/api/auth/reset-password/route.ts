import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/models/User';
import { query } from '@/lib/database';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Interface para os dados de reset de senha
interface ResetPasswordData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

// Interface para o payload do token JWT
interface ResetTokenPayload {
  userId: number;
  email: string;
  type: string;
  iat: number;
  exp: number;
}

// Função para validar força da senha
function validatePasswordStrength(password: string): { isValid: boolean; message?: string } {
  if (password.length < 8) {
    return { isValid: false, message: 'A senha deve ter pelo menos 8 caracteres' };
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, message: 'A senha deve conter pelo menos uma letra minúscula' };
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return { isValid: false, message: 'A senha deve conter pelo menos uma letra maiúscula' };
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, message: 'A senha deve conter pelo menos um número' };
  }
  
  return { isValid: true };
}

// Função para verificar token de reset
async function verifyResetToken(token: string): Promise<{ isValid: boolean; payload?: ResetTokenPayload; message?: string }> {
  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const resetSecret = secret + '-reset';
    
    // Verificar e decodificar o token
    const payload = jwt.verify(token, resetSecret) as ResetTokenPayload;
    
    // Verificar se é um token de reset
    if (payload.type !== 'password_reset') {
      return { isValid: false, message: 'Token inválido' };
    }
    
    // Verificar se o token existe no banco e não foi usado
    const queryText = `
      SELECT id, user_id, expires_at, used 
      FROM password_reset_tokens 
      WHERE token = $1 AND used = false
    `;
    
    const result = await query(queryText, [token]);
    
    if (result.rows.length === 0) {
      return { isValid: false, message: 'Token inválido ou já utilizado' };
    }
    
    const tokenData = result.rows[0];
    
    // Verificar se o token expirou
    if (new Date() > new Date(tokenData.expires_at)) {
      return { isValid: false, message: 'Token expirado' };
    }
    
    // Verificar se o user_id do token corresponde ao payload
    if (tokenData.user_id !== payload.userId) {
      return { isValid: false, message: 'Token inválido' };
    }
    
    return { isValid: true, payload };
    
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    return { isValid: false, message: 'Token inválido' };
  }
}

// Função para marcar token como usado
async function markTokenAsUsed(token: string): Promise<void> {
  const queryText = `
    UPDATE password_reset_tokens 
    SET used = true, used_at = NOW() 
    WHERE token = $1
  `;
  
  await query(queryText, [token]);
}

// Função para atualizar senha do usuário
async function updateUserPassword(userId: number, newPassword: string): Promise<void> {
  const saltRounds = 12;
  const password_hash = await bcrypt.hash(newPassword, saltRounds);
  
  const queryText = `
    UPDATE users 
    SET password_hash = $1, updated_at = NOW() 
    WHERE id = $2
  `;
  
  await query(queryText, [password_hash, userId]);
}

export async function POST(request: NextRequest) {
  try {
    const body: ResetPasswordData = await request.json();
    const { token, newPassword, confirmPassword } = body;

    // Validação dos campos obrigatórios
    if (!token || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { 
          error: 'Todos os campos são obrigatórios',
          details: 'Token, nova senha e confirmação são necessários'
        },
        { status: 400 }
      );
    }

    // Verificar se as senhas coincidem
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { 
          error: 'Senhas não coincidem',
          details: 'A nova senha e a confirmação devem ser iguais'
        },
        { status: 400 }
      );
    }

    // Validar força da senha
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Senha não atende aos critérios de segurança',
          details: passwordValidation.message
        },
        { status: 400 }
      );
    }

    // Verificar token de reset
    const tokenVerification = await verifyResetToken(token);
    if (!tokenVerification.isValid) {
      return NextResponse.json(
        { 
          error: 'Token inválido',
          details: tokenVerification.message
        },
        { status: 400 }
      );
    }

    const payload = tokenVerification.payload!;

    // Verificar se o usuário ainda existe e está ativo
    const user = await UserModel.findById(payload.userId);
    if (!user || !user.is_active) {
      return NextResponse.json(
        { 
          error: 'Usuário não encontrado',
          details: 'Usuário não existe ou está inativo'
        },
        { status: 404 }
      );
    }

    // Atualizar senha do usuário
    await updateUserPassword(payload.userId, newPassword);

    // Marcar token como usado
    await markTokenAsUsed(token);

    return NextResponse.json(
      { 
        success: true,
        message: 'Senha redefinida com sucesso'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: 'Tente novamente mais tarde'
      },
      { status: 500 }
    );
  }
}

// Método GET para verificar validade de um token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { 
          error: 'Token não fornecido',
          details: 'Parâmetro token é obrigatório'
        },
        { status: 400 }
      );
    }

    const tokenVerification = await verifyResetToken(token);
    
    if (!tokenVerification.isValid) {
      return NextResponse.json(
        { 
          valid: false,
          message: tokenVerification.message
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { 
        valid: true,
        email: tokenVerification.payload!.email,
        message: 'Token válido'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro ao verificar token:', error);
    
    return NextResponse.json(
      { 
        valid: false,
        message: 'Erro ao verificar token'
      },
      { status: 500 }
    );
  }
}