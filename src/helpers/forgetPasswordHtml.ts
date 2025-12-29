export const forgetPasswordHtml = (fullName: string, otp: string) => {
  return `<html>
  <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color: #f4f4f7;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 0; background-color: #f4f4f7;">
      <tr>
        <td align="center">
          <table width="420" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.08); overflow: hidden;">
            
            <!-- Header -->
            <tr>
              <td align="center" style="background-color: #dc3545; padding: 20px;">
                <h2 style="color: #ffffff; margin: 0;">Password Reset</h2>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 30px; color: #333;">
                <p style="font-size: 16px; margin-top: 0;">
                  Hi <strong>${fullName}</strong>,
                </p>

                <p style="font-size: 16px; line-height: 1.5;">
                  We received a request to reset your password.  
                  Please use the OTP below to continue:
                </p>

                <!-- OTP Box -->
                <div style="text-align: center; margin: 30px 0;">
                  <span style="
                    display: inline-block;
                    font-size: 30px;
                    letter-spacing: 6px;
                    font-weight: bold;
                    color: #dc3545;
                    background-color: #f8d7da;
                    padding: 12px 24px;
                    border-radius: 8px;
                  ">
                    ${otp}
                  </span>
                </div>

                <p style="font-size: 14px; color: #555;">
                  ⏱ This OTP is valid for <strong>5 minutes</strong>.
                </p>

                <p style="font-size: 14px; color: #777;">
                  If you did not request a password reset, please ignore this email.  
                  Your account will remain secure.
                </p>

                <p style="margin-top: 30px; font-size: 16px;">
                  Thanks,<br />
                  <strong>The Support Team</strong>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="background-color: #f4f4f7; padding: 15px; font-size: 12px; color: #999;">
                © ${new Date().getFullYear()} Play Spark. All rights reserved.
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
};
