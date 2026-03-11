const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT, 10),
    secure: false,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

/**
 * Send password reset email
 * @param {string} to - Recipient email
 * @param {string} token - Reset token
 */
async function sendResetEmail(to, token) {
    const resetUrl = `${process.env.FRONTEND_URL}/#/reset-password/${token}`;

    const mailOptions = {
        from: process.env.MAIL_FROM,
        to,
        subject: 'Monitor-Flow - Recuperação de Senha',
        html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">🔄 Monitor-Flow</h1>
          <p style="color: rgba(255,255,255,0.85); margin-top: 8px; font-size: 14px;">Sistema de Monitoramento</p>
        </div>
        <div style="padding: 32px; color: #e0e0e0;">
          <h2 style="color: #ffffff; font-size: 20px; margin-top: 0;">Recuperação de Senha</h2>
          <p>Você solicitou a redefinição da sua senha. Clique no botão abaixo para criar uma nova senha:</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Redefinir Senha
            </a>
          </div>
          <p style="font-size: 13px; color: #888888;">Este link expira em <strong>1 hora</strong>.</p>
          <p style="font-size: 13px; color: #888888;">Se você não solicitou esta redefinição, ignore este e-mail.</p>
          <hr style="border: none; border-top: 1px solid #333; margin: 24px 0;" />
          <p style="font-size: 12px; color: #666666; text-align: center;">Monitor-Flow &copy; ${new Date().getFullYear()}</p>
        </div>
      </div>
    `,
    };

    await transporter.sendMail(mailOptions);
}

module.exports = { sendResetEmail };
