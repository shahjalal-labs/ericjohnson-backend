export const emailBody = (fullName: string, otp: string) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Verify Your Email</title>
      </head>

      <body
        style="
          margin: 0;
          padding: 0;
          background-color: #f6f2f2;
          font-family: Arial, Helvetica, sans-serif;
          color: #2a1a1a;
        "
      >
        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="background-color: #f6f2f2; padding: 40px 15px;"
        >
          <tr>
            <td align="center">

              <!-- Main Card -->
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  max-width: 560px;
                  background: #160607;
                  border: 1px solid #5d160f;
                  border-radius: 18px;
                  overflow: hidden;
                  box-shadow: 0 20px 40px rgba(22, 6, 7, 0.16);
                "
              >

                <!-- Top Accent -->
                <tr>
                  <td
                    style="
                      height: 5px;
                      background: #d62aa5;
                      font-size: 0;
                      line-height: 0;
                    "
                  >
                  </td>
                </tr>

                <!-- Header -->
                <tr>
                  <td
                    align="center"
                    style="
                      padding: 38px 30px 28px;
                      background: #0b0303;
                    "
                  >
                    <div
                      style="
                        font-size: 13px;
                        font-weight: bold;
                        letter-spacing: 3px;
                        color: #f0b900;
                        text-transform: uppercase;
                      "
                    >
                      INTERNET
                    </div>

                    <div
                      style="
                        margin-top: 3px;
                        font-size: 13px;
                        font-weight: bold;
                        letter-spacing: 3px;
                        color: #f0b900;
                        text-transform: uppercase;
                      "
                    >
                      BACHELOR
                    </div>

                    <div
                      style="
                        width: 55px;
                        height: 3px;
                        margin: 18px auto 0;
                        background: #d83ab1;
                      "
                    ></div>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td
                    style="
                      padding: 42px 45px 45px;
                      background: linear-gradient(
                        145deg,
                        #210708 0%,
                        #130304 55%,
                        #080202 100%
                      );
                    "
                  >

                    <p
                      style="
                        margin: 0 0 10px;
                        color: #f2c2d8;
                        font-size: 16px;
                        line-height: 26px;
                      "
                    >
                      Hello ${fullName},
                    </p>

                    <h1
                      style="
                        margin: 0 0 15px;
                        font-family: Georgia, 'Times New Roman', serif;
                        font-size: 34px;
                        line-height: 42px;
                        font-weight: bold;
                        color: #f4a9d0;
                      "
                    >
                      Verify Your Email
                    </h1>

                    <p
                      style="
                        margin: 0 0 30px;
                        color: #bfa9aa;
                        font-size: 15px;
                        line-height: 25px;
                      "
                    >
                      Welcome to Internet Bachelor. Use the verification
                      code below to complete your signup and start your
                      journey.
                    </p>

                    <!-- OTP Box -->
                    <table
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      border="0"
                    >
                      <tr>
                        <td
                          align="center"
                          style="
                            padding: 28px 20px;
                            background-color: #0a0303;
                            border: 1px solid #7c1b50;
                            border-radius: 12px;
                          "
                        >
                          <div
                            style="
                              margin-bottom: 10px;
                              color: #a99a9c;
                              font-size: 11px;
                              font-weight: bold;
                              letter-spacing: 3px;
                              text-transform: uppercase;
                            "
                          >
                            Verification Code
                          </div>

                          <div
                            style="
                              color: #e83db2;
                              font-size: 38px;
                              line-height: 45px;
                              font-weight: bold;
                              letter-spacing: 9px;
                            "
                          >
                            ${otp}
                          </div>
                        </td>
                      </tr>
                    </table>

                    <p
                      style="
                        margin: 24px 0 0;
                        text-align: center;
                        color: #918183;
                        font-size: 13px;
                        line-height: 21px;
                      "
                    >
                      This verification code will expire in
                      <strong style="color: #d9b4c4;">5 minutes</strong>.
                    </p>

                    <p
                      style="
                        margin: 32px 0 0;
                        color: #bfa9aa;
                        font-size: 14px;
                        line-height: 23px;
                      "
                    >
                      If you didn't request this verification code, you can
                      safely ignore this email.
                    </p>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td
                    align="center"
                    style="
                      padding: 24px 30px;
                      background-color: #090303;
                      border-top: 1px solid #321012;
                    "
                  >
                    <p
                      style="
                        margin: 0;
                        color: #716264;
                        font-size: 12px;
                        line-height: 20px;
                      "
                    >
                      © ${new Date().getFullYear()} Internet Bachelor
                    </p>

                    <p
                      style="
                        margin: 5px 0 0;
                        color: #514547;
                        font-size: 11px;
                      "
                    >
                      Your journey starts here.
                    </p>
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

export const emailBodyForPasswordReset = (fullName: string, otp: string) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Password Reset</title>
      </head>

      <body
        style="
          margin: 0;
          padding: 0;
          background-color: #f4f6fb;
          font-family: Arial, Helvetica, sans-serif;
          color: #1f2937;
        "
      >
        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="background: linear-gradient(160deg, #f4f6fb 0%, #eef2ff 100%); padding: 42px 14px;"
        >
          <tr>
            <td align="center">
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  max-width: 560px;
                  background-color: #ffffff;
                  border: 1px solid #e5e7eb;
                  border-radius: 18px;
                  overflow: hidden;
                  box-shadow: 0 16px 32px rgba(17, 24, 39, 0.1);
                "
              >
                <tr>
                  <td
                    style="
                      padding: 30px 34px;
                      background: linear-gradient(120deg, #111827 0%, #4f46e5 100%);
                    "
                  >
                    <p
                      style="
                        margin: 0;
                        color: #c7d2fe;
                        font-size: 12px;
                        letter-spacing: 2.5px;
                        text-transform: uppercase;
                        font-weight: bold;
                      "
                    >
                      Internet Bachelor
                    </p>

                    <h1
                      style="
                        margin: 12px 0 0;
                        color: #ffffff;
                        font-size: 30px;
                        line-height: 38px;
                        font-weight: bold;
                      "
                    >
                      Password Reset Code
                    </h1>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 34px 34px 30px;">
                    <p
                      style="
                        margin: 0 0 12px;
                        color: #111827;
                        font-size: 16px;
                        line-height: 24px;
                      "
                    >
                      Hi <strong>${fullName}</strong>,
                    </p>

                    <p
                      style="
                        margin: 0 0 24px;
                        color: #4b5563;
                        font-size: 15px;
                        line-height: 25px;
                      "
                    >
                      We received a request to reset your password. Use this code to continue:
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td
                          align="center"
                          style="
                            padding: 24px 16px;
                            background-color: #f8f7ff;
                            border: 1px dashed #a5b4fc;
                            border-radius: 14px;
                          "
                        >
                          <p
                            style="
                              margin: 0 0 8px;
                              color: #6366f1;
                              font-size: 11px;
                              font-weight: bold;
                              letter-spacing: 2.5px;
                              text-transform: uppercase;
                            "
                          >
                            Verification Code
                          </p>

                          <p
                            style="
                              margin: 0;
                              color: #312e81;
                              font-size: 40px;
                              line-height: 46px;
                              font-weight: bold;
                              letter-spacing: 8px;
                            "
                          >
                            ${otp}
                          </p>
                        </td>
                      </tr>
                    </table>

                    <p
                      style="
                        margin: 20px 0 0;
                        color: #6b7280;
                        font-size: 13px;
                        line-height: 22px;
                      "
                    >
                      This code will expire in <strong style="color: #374151;">5 minutes</strong>.
                    </p>

                    <p
                      style="
                        margin: 16px 0 0;
                        color: #6b7280;
                        font-size: 13px;
                        line-height: 22px;
                      "
                    >
                      If you did not request this, you can safely ignore this email.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding: 18px 34px 28px;
                      border-top: 1px solid #eef2f7;
                    "
                  >
                    <p
                      style="
                        margin: 0;
                        color: #9ca3af;
                        font-size: 12px;
                        line-height: 18px;
                      "
                    >
                      © ${new Date().getFullYear()} Internet Bachelor
                    </p>
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
