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
    return { isValid: false, message: 'Password must be at least 8 characters' };
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
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
      return { isValid: false, message: 'Invalid token' };
    }
    
    // Verificar se o token existe no banco e não foi usado
    const queryText = `
      SELECT id, user_id, expires_at, used 
      FROM password_reset_tokens 
      WHERE token = $1 AND used = false
    `;
    
    const result = await query(queryText, [token]);
    
    if (result.rows.length === 0) {
      return { isValid: false, message: 'Invalid or already used token' };
    }
    
    const tokenData = result.rows[0];
    
    // Verificar se o token expirou
    if (new Date() > new Date(tokenData.expires_at)) {
      return { isValid: false, message: 'Expired token' };
    }
    
    // Verificar se o user_id do token corresponde ao payload
    if (tokenData.user_id !== payload.userId) {
      return { isValid: false, message: 'Invalid token' };
    }
    
    return { isValid: true, payload };
    
  } catch (error) {
    console.error('Error verifying token:', error);
    return { isValid: false, message: 'Invalid token' };
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
          error: 'All fields are required',
          details: 'Token, new password and confirmation are required'
        },
        { status: 400 }
      );
    }

    // Verificar se as senhas coincidem
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          error: 'Passwords do not match',
          details: 'The new password and confirmation must be the same'
        },
        { status: 400 }
      );
    }

    // Validar força da senha
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          error: 'Password does not meet security criteria',
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
          error: 'Invalid token',
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
          error: 'User not found',
          details: 'User does not exist or is inactive'
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
        message: 'Password reset successfully'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error resetting password:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: 'Please try again later'
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
          error: 'Token not provided',
          details: 'Token parameter is required'
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
        message: 'Valid token'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error verifying token:', error);
    
    return NextResponse.json(
      { 
        valid: false,
        message: 'Error verifying token'
      },
      { status: 500 }
    );
  }
}