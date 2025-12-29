export const verificationHtml = (fullName: string, otp: string) => {
  return `
    <html>
  <body style="margin:0; padding:0; font-family: 'Arial', sans-serif; background-color: #f4f4f7;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f7; padding: 40px 0;">
      <tr>
        <td align="center">
          <table width="400" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); overflow: hidden;">
            <!-- Header -->
            <tr>
              <td align="center" style="background-color: #007BFF; padding: 20px;">
                <h2 style="color: #ffffff; margin: 0;">Account Verification</h2>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 30px; color: #333333;">
                <p style="font-size: 16px;">Hi <b>${fullName}</b>,</p>
                <p style="font-size: 16px;">You requested to reset your password. Use the OTP below to proceed:</p>
                
                <p style="text-align: center; font-size: 28px; font-weight: bold; color: #007BFF; margin: 30px 0;">${otp}</p>
                
                <p style="font-size: 14px; color: #555555;">
                  This OTP is valid for <b>5 minutes</b>. If you did not request this, please ignore this email.
                </p>
                
                <p style="margin-top: 30px; font-size: 16px;">Thanks,<br>The Support Team</p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="background-color: #f4f4f7; padding: 15px; font-size: 12px; color: #999999;">
                &copy; ${new Date().getFullYear()} Play Spark. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};
