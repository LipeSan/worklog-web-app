import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/models/User';
import { query } from '@/lib/database';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Interface para os dados de solicitação de reset
interface ForgotPasswordData {
  email: string;
}

// Função para validar email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Função para gerar token de reset
function generateResetToken(userId: number, email: string): string {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  const resetSecret = secret + '-reset'; // Adiciona sufixo para tokens de reset
  
  return jwt.sign(
    { 
      userId, 
      email,
      type: 'password_reset',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
    },
    resetSecret
  );
}

// Função para salvar token de reset no banco
async function saveResetToken(userId: number, token: string, expiresAt: Date): Promise<void> {
  const queryText = `
    INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      token = EXCLUDED.token,
      expires_at = EXCLUDED.expires_at,
      created_at = NOW(),
      used = false
  `;
  
  await query(queryText, [userId, token, expiresAt]);
}

// Função simulada de envio de email (em produção, usar serviço real)
async function sendResetEmail(email: string, resetToken: string): Promise<void> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  
  // Em produção, aqui você integraria com um serviço de email como:
  // - SendGrid
  // - AWS SES
  // - Nodemailer
  // - Resend
  
  console.log(`
    ===== PASSWORD RECOVERY EMAIL =====
    To: ${email}
    Subject: Password Recovery - WorkLog
    
    Hello,
    
    You requested password recovery. Click the link below to reset your password:
    
    ${resetUrl}
    
    This link expires in 24 hours.
    
    If you did not request this recovery, please ignore this email.
    
    Best regards,
    WorkLog Team
    ==========================================
  `);
}

export async function POST(request: NextRequest) {
  try {
    const body: ForgotPasswordData = await request.json();
    const { email } = body;

    // Validação dos campos obrigatórios
    if (!email) {
      return NextResponse.json(
        { 
          error: 'Email is required',
          details: 'Please provide email for recovery'
        },
        { status: 400 }
      );
    }

    // Validação do email
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { 
          error: 'Invalid email',
          details: 'Invalid email format'
        },
        { status: 400 }
      );
    }

    // Buscar usuário por email
    const user = await UserModel.findByEmail(email);
    
    // Por segurança, sempre retornamos sucesso mesmo se o email não existir
    // Isso evita que atacantes descubram quais emails estão cadastrados
    if (!user) {
      return NextResponse.json(
        { 
          success: true,
          message: 'If the email is registered, you will receive recovery instructions'
        },
        { status: 200 }
      );
    }

    // Verificar se o usuário está ativo
    if (!user.is_active) {
      return NextResponse.json(
        { 
          success: true,
          message: 'If the email is registered, you will receive recovery instructions'
        },
        { status: 200 }
      );
    }

    // Gerar token de reset
    const resetToken = generateResetToken(user.id, user.email);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Salvar token no banco
    await saveResetToken(user.id, resetToken, expiresAt);

    // Enviar email (simulado)
    await sendResetEmail(user.email, resetToken);

    return NextResponse.json(
      { 
        success: true,
        message: 'If the email is registered, you will receive recovery instructions'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error processing recovery request:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: 'Please try again later'
      },
      { status: 500 }
    );
  }
}

// Método GET para verificar se o endpoint está funcionando
export async function GET() {
  return NextResponse.json(
    { 
      message: 'Password recovery endpoint active',
      timestamp: new Date().toISOString()
    },
    { status: 200 }
  );
}