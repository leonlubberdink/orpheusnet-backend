function getResetPasswordTemplate(url) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset your password</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        padding: 20px;
      }
      .container {
        background-color: #fff;
        padding: 20px;
        border-radius: 5px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      a.confirmation-link {
        display: inline-block;
        padding: 10px 20px;
        background-color: #de4e29;
        color: #ffffff;
        text-decoration: none;
        border-radius: 5px;
      }
    </style>
    </head>
    <body>
    <div class="container">
      <h2>Reset your password</h2>
      <p>Please click the link below to reset your password:</p>
      <a href="${url}" class="confirmation-link">Reset Password</a>
      <p>Alternatively you can simply grab this link and paste it into your browser: ${url}.</p>
      <p>If you did not request this email, please ignore it.</p>
    </div>
    </body>
    </html>
      `;
}

module.exports = getResetPasswordTemplate;
