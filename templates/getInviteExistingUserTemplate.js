function getInviteExistingUserTemplate(communityName) {
  return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Confirmation</title>
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
        <h2>You got invited to join a community on Orpheusnet!</h2>
        <p>Someone invited you to join their community: <b>${communityName}</b>.</p>
        <p>Just pop over to your account and hit accept on that invite waiting for you!</p>
      </div>
      </body>
      </html>
        `;
}

module.exports = getInviteExistingUserTemplate;
