import { Resend } from "resend";

/**
 * Envia e-mail com código OTP de 6 dígitos para validação de conta via Resend.
 * Lê dinamicamente process.env.RESEND_API_KEY a cada invocação.
 */
export async function sendVerificationCodeEmail({
  toEmail,
  code,
  name,
}: {
  toEmail: string;
  code: string;
  name: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const cleanEmail = toEmail.trim().toLowerCase();
  const firstName = name ? name.split(" ")[0] : "Usuário";

  const apiKey = (process.env.RESEND_API_KEY || "").trim();
  const fromEmail = (process.env.RESEND_FROM_EMAIL || "TrainerMatch <onboarding@resend.dev>").trim();

  // Template HTML profissional e responsivo com a identidade visual do TrainerMatch
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Seu Código de Verificação · TrainerMatch</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .container { max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 32px 24px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { color: #93c5fd; margin: 6px 0 0; font-size: 13px; font-weight: 500; }
        .content { padding: 32px 28px; text-align: center; }
        .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
        .message { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 28px; }
        .code-box { background-color: #eff6ff; border: 2px dashed #3b82f6; border-radius: 12px; padding: 20px 16px; margin: 0 auto 28px; max-width: 280px; }
        .code { font-family: 'SF Mono', Consolas, Menlo, Monaco, monospace; font-size: 36px; font-weight: 800; color: #1d4ed8; letter-spacing: 6px; margin: 0; }
        .expires { font-size: 12px; color: #64748b; margin-top: 8px; font-weight: 500; }
        .footer { border-top: 1px solid #f1f5f9; padding: 20px 24px; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.5; }
        .security-note { font-size: 12px; color: #64748b; line-height: 1.5; margin-bottom: 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>TrainerMatch</h1>
          <p>Plataforma para Academias e Professores</p>
        </div>
        <div class="content">
          <div class="greeting">Olá, ${firstName}! 👋</div>
          <div class="message">
            Obrigado por se cadastrar no TrainerMatch. Para ativar sua conta e garantir a segurança do seu acesso, utilize o código de verificação de 6 dígitos abaixo:
          </div>
          <div class="code-box">
            <div class="code">${code}</div>
            <div class="expires">⏱ Válido por 15 minutos</div>
          </div>
          <p class="security-note">
            Se você não realizou este cadastro, desconsidere esta mensagem. Sua conta não será ativada sem a confirmação deste código.
          </p>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} TrainerMatch · Todos os direitos reservados.
        </div>
      </div>
    </body>
    </html>
  `;

  // Se não houver chave Resend configurada
  if (!apiKey) {
    console.warn("[Resend] RESEND_API_KEY não foi encontrada nas variáveis de ambiente.");
    console.log(`[Resend Fallback] Código OTP para ${cleanEmail}: ${code}`);
    return {
      success: false,
      error: "RESEND_API_KEY_NOT_FOUND"
    };
  }

  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [cleanEmail],
      subject: `${code} é o seu código de verificação · TrainerMatch`,
      html: htmlContent,
      text: `Olá, ${firstName}!\n\nSeu código de verificação no TrainerMatch é: ${code}\n\nEste código expira em 15 minutos.\nSe você não solicitou este código, por favor ignore este e-mail.`,
    });

    if (error) {
      console.error("[Resend] Erro ao enviar e-mail:", error);
      // Mesmo com erro de envio pelo Resend (e.g. domínio não verificado em plano free),
      // fazemos log do código no console para que o desenvolvedor/testador consiga validar a tela
      console.log(`[Resend Fallback Log] Código de segurança para ${cleanEmail}: ${code}`);
      return { success: false, error: error.message };
    }

    console.log(`[Resend] E-mail de verificação enviado com sucesso para ${cleanEmail}. ID: ${data?.id}`);
    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error("[Resend] Exceção ao disparar e-mail:", err);
    console.log(`[Resend Fallback Log] Código de segurança para ${cleanEmail}: ${code}`);
    return { success: false, error: err?.message || "Erro ao conectar com serviço de e-mail." };
  }
}
