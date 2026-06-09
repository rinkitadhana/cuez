import nodemailer from "nodemailer"
import dotenv from "dotenv"
dotenv.config()

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export const getOTPEmailTemplate = (username: string, otp: string): string => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
  <style>
    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
        padding: 24px 16px !important;
      }
      .header h1 {
        font-size: 24px !important;
      }
      .otp-code {
        font-size: 28px !important;
        letter-spacing: 8px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f5f7fa">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table class="container" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 40px 40px 20px 40px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <img src="https://pub-26c989eb78e2450ba6e03cd8376b3ae1.r2.dev/cuez/cuez-name-logo.png" alt="Cuez Logo" width="160px" height="auto" style="display: block; margin: 0 auto;">
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 20px; border-bottom: 1px solid #e6e3e3;"></td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Header Section -->
          <tr>
            <td align="center" class="header" style="padding: 0 40px 30px 40px;">
              <h1 style="color: #1a1a1a; font-size: 22px; font-weight: 600; margin: 0; letter-spacing: -0.5px;">Verify Your Email Address</h1>
            </td>
          </tr>
          
          <!-- Content Section -->
          <tr>
            <td style="padding: 0 40px;">
              <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin-bottom: 24px;">Hello ${username},</p>
              <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin-bottom: 32px;">To complete your account verification and ensure your security, please use the verification code below:</p>
            </td>
          </tr>
          
          <!-- OTP Section -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="background: linear-gradient(135deg, #f8faff 0%, #eef2ff 100%); border-radius: 12px; padding: 32px 24px; margin: 20px 0; text-align: center; border: 1px solid rgba(77, 107, 254, 0.2);">
                <h2 class="otp-code" style="color: #4d6bfe; font-size: 36px; font-weight: 700; letter-spacing: 12px; margin: 0; font-family: 'SF Mono', 'Courier New', monospace;">${otp}</h2>
              </div>
            </td>
          </tr>
          
          <!-- Timer Section -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="background-color: #fafbff; border-radius: 8px; padding: 16px; margin-bottom: 32px; text-align: center; border: 1px solid rgba(77, 107, 254, 0.1);">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center">
                      <img src="https://img.icons8.com/ios-filled/50/4d6bfe/clock--v1.png" alt="clock" width="16" height="16" style="vertical-align: middle; margin-right: 8px;">
                      <span style="color: #4d6bfe; font-size: 14px; font-weight: 500; vertical-align: middle;">Code expires in <strong>10 minutes</strong></span>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          
          <!-- Security Notice -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <div style="padding: 24px; background-color: #fafbff; border-radius: 12px; margin-bottom: 32px;">
                <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0;">
                  If you didn't request this code, please ignore this email or contact our support team immediately. We take your account security seriously.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <div style="text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #e6e3e3; padding-top: 32px;">
                <p style="margin: 0 0 16px 0;">Best regards,</p>
                <p style="margin: 0; color: #4d6bfe; font-weight: 600;">Cuez Team</p>
                
                <div style="margin-top: 24px; color: #a0aec0; font-size: 12px;">
                  <p style="margin: 0 0 8px 0;">© 2025 Cuez. All rights reserved.</p>
                  <p style="margin: 0;">
                    <a href="#" style="color: #4d6bfe; text-decoration: none; margin: 0 8px;">Privacy Policy</a> • 
                    <a href="#" style="color: #4d6bfe; text-decoration: none; margin: 0 8px;">Terms of Service</a>
                  </p>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export const getLoginEmailTemplate = (username: string): string => {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>New Login Notification</title>
  </head>
  <body
    style="
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f9fafb;
    "
  >
    <table
      width="100%"
      border="0"
      cellspacing="0"
      cellpadding="0"
      bgcolor="#f9fafb"
    >
      <tr>
        <td align="center" style="padding: 40px 0">
          <table
            width="600"
            border="0"
            cellspacing="0"
            cellpadding="0"
            bgcolor="#ffffff"
            style="
              border-radius: 16px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            "
          >
            <!-- Logo Header -->
            <tr>
              <td align="center" style="padding: 40px 40px 20px 40px">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center">
                      <img
                        src="https://pub-26c989eb78e2450ba6e03cd8376b3ae1.r2.dev/cuez/cuez-name-logo.png"
                        alt="Cuez Logo"
                        width="160px"
                        height="auto"
                        style="display: block; margin: 0 auto"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td
                      style="
                        padding-top: 20px;
                        border-bottom: 1px solid #e6e3e3;
                      "
                    ></td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Header Section -->
            <tr>
              <td
                align="center"
                class="header"
                style="padding: 0 40px 30px 40px"
              >
                <h1
                  style="
                    color: #1a1a1a;
                    font-size: 22px;
                    font-weight: 600;
                    margin: 0;
                    letter-spacing: -0.5px;
                  "
                >
                  New Login Detected
                </h1>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 10px 40px 20px 40px">
                <p
                  style="
                    color: #334155;
                    font-size: 16px;
                    line-height: 1.6;
                    margin: 0 0 24px 0;
                  "
                >
                  Hello ${username},
                </p>
                <p
                  style="
                    color: #334155;
                    font-size: 16px;
                    line-height: 1.6;
                    margin: 0 0 24px 0;
                  "
                >
                  We detected a new login to your Cuez account. If this was you,
                  no action is needed.
                </p>
                <p
                  style="
                    color: #334155;
                    font-size: 16px;
                    line-height: 1.6;
                    margin: 0 0 32px 0;
                  "
                >
                  If you didn't log in recently, please secure your account by
                  changing your password immediately.
                </p>
              </td>
            </tr>

            <!-- Login Details -->
            <tr>
              <td style="padding: 0 40px">
                <div
                  style="
                    background-color: #fafbff;
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 32px;
                    text-align: left;
                    border: 1px solid rgba(77, 107, 254, 0.1);
                  "
                >
                  <table
                    width="100%"
                    border="0"
                    cellspacing="0"
                    cellpadding="0"
                  >
                    <tr>
                      <td>
                        <p
                          style="
                            color: #334155;
                            font-size: 14px;
                            margin: 0 0 8px 0;
                          "
                        >
                          <strong>Date & Time:</strong> ${new Date().toLocaleString()}
                        </p>
                        <p style="color: #334155; font-size: 14px; margin: 0">
                          <strong>Device:</strong> Web Browser
                        </p>
                      </td>
                    </tr>
                  </table>
                </div>
              </td>
            </tr>

            <!-- Security Notice -->
            <tr>
              <td style="padding: 0 40px 30px 40px">
                <div
                  style="
                    padding: 24px;
                    background-color: #fafbff;
                    border-radius: 12px;
                    margin-bottom: 32px;
                  "
                >
                  <p
                    style="
                      color: #64748b;
                      font-size: 14px;
                      line-height: 1.6;
                      margin: 0;
                    "
                  >
                    If you didn't log in, please contact our support team
                    immediately. We take your account security seriously.
                  </p>
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 0 40px 40px 40px">
                <div
                  style="
                    text-align: center;
                    color: #64748b;
                    font-size: 14px;
                    border-top: 1px solid #e6e3e3;
                    padding-top: 32px;
                  "
                >
                  <p style="margin: 0 0 16px 0">Best regards,</p>
                  <p style="margin: 0; color: #4d6bfe; font-weight: 600">
                    Cuez Team
                  </p>

                  <div
                    style="margin-top: 24px; color: #a0aec0; font-size: 12px"
                  >
                    <p style="margin: 0 0 8px 0">
                      © 2025 Cuez. All rights reserved.
                    </p>
                    <p style="margin: 0">
                      <a
                        href="#"
                        style="
                          color: #4d6bfe;
                          text-decoration: none;
                          margin: 0 8px;
                        "
                        >Privacy Policy</a
                      >
                      •
                      <a
                        href="#"
                        style="
                          color: #4d6bfe;
                          text-decoration: none;
                          margin: 0 8px;
                        "
                        >Terms of Service</a
                      >
                    </p>
                  </div>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`
}
