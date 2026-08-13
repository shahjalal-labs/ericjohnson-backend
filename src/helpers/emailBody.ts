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
          background-color: #090303;
          font-family: Arial, Helvetica, sans-serif;
          color: #ffffff;
        "
      >
        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="background-color: #090303; padding: 40px 15px;"
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