export async function sendChatPushNotification({
  receiverId,
  senderName,
  messageContent,
  conversationId,
}: {
  receiverId: string;
  senderName: string;
  messageContent: string;
  conversationId: string;
}) {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !apiKey) {
    console.warn("OneSignal Push Send Warn: Missing NEXT_PUBLIC_ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY in environment variables.");
    return;
  }

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.buykarlo.in";

    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${apiKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        include_aliases: {
          external_id: [receiverId],
        },
        target_channel: "push",
        headings: {
          en: senderName,
        },
        contents: {
          en: messageContent.length > 80 ? `${messageContent.substring(0, 77)}...` : messageContent,
        },
        url: `${siteUrl}/messages?conversationId=${conversationId}`,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OneSignal Push API Error:", errText);
    }
  } catch (error) {
    console.error("OneSignal Push API Network Exception:", error);
  }
}

export async function sendChatEmailNotification({
  receiverId,
  senderName,
  messageContent,
  conversationId,
}: {
  receiverId: string;
  senderName: string;
  messageContent: string;
  conversationId: string;
}) {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !apiKey) {
    console.warn("OneSignal Email Send Warn: Missing NEXT_PUBLIC_ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY in environment variables.");
    return;
  }

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.buykarlo.in";
    const chatUrl = `${siteUrl}/messages?conversationId=${conversationId}`;

    const truncatedMessage = messageContent.length > 150
      ? `${messageContent.substring(0, 147)}...`
      : messageContent;

    const emailSubject = `New message from ${senderName} on BuyKarlo 💬`;
    const emailBody = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Message on BuyKarlo</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f6f9fc;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f6f9fc;
      padding: 40px 20px;
      box-sizing: border-box;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      border: 1px solid #eef2f5;
    }
    .header {
      background: linear-gradient(135deg, #1C16CF 0%, #6B38D4 100%);
      padding: 32px;
      text-align: center;
    }
    .logo {
      color: #ffffff;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0;
      text-decoration: none;
    }
    .content {
      padding: 40px 32px;
    }
    .title {
      font-size: 20px;
      font-weight: 700;
      color: #1a1f36;
      margin-top: 0;
      margin-bottom: 12px;
    }
    .subtitle {
      font-size: 16px;
      color: #4f566b;
      margin-bottom: 24px;
      line-height: 1.5;
    }
    .message-card {
      background-color: #f8fafc;
      border-left: 4px solid #1C16CF;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 32px;
    }
    .sender {
      font-size: 14px;
      font-weight: 700;
      color: #1C16CF;
      margin-bottom: 6px;
    }
    .message-text {
      font-size: 15px;
      color: #1a1f36;
      line-height: 1.6;
      margin: 0;
      font-style: italic;
    }
    .button-container {
      text-align: center;
      margin-bottom: 8px;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #1C16CF 0%, #6B38D4 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-size: 15px;
      font-weight: 700;
      padding: 14px 32px;
      border-radius: 12px;
      box-shadow: 0 4px 10px rgba(28, 22, 207, 0.2);
    }
    .footer {
      padding: 32px;
      text-align: center;
      background-color: #fafbfc;
      border-top: 1px solid #eef2f5;
    }
    .footer-text {
      font-size: 12px;
      color: #a3acb9;
      line-height: 1.5;
      margin: 0;
    }
    .footer-link {
      color: #6B38D4;
      text-decoration: none;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo">BuyKarlo</div>
      </div>
      <div class="content">
        <h1 class="title">New Message Received 💬</h1>
        <p class="subtitle">You have received a new message from a fellow campus student on BuyKarlo:</p>
        
        <div class="message-card">
          <div class="sender">${senderName}</div>
          <p class="message-text">"${truncatedMessage}"</p>
        </div>
        
        <div class="button-container">
          <a href="${chatUrl}" class="btn" style="color: #ffffff !important; text-decoration: none;">Reply in Chat</a>
        </div>
      </div>
      <div class="footer">
        <p class="footer-text">
          Aligarh Muslim University Verified Student Marketplace.<br>
          If you don't want to receive these emails, you can update your notification settings in your profile.<br>
          <a href="${siteUrl}" class="footer-link">Visit BuyKarlo</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;

    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${apiKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        include_aliases: {
          external_id: [receiverId],
        },
        target_channel: "email",
        email_subject: emailSubject,
        email_body: emailBody,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OneSignal Email API Error:", errText);
    }
  } catch (error) {
    console.error("OneSignal Email API Network Exception:", error);
  }
}

export async function sendChatNotifications({
  receiverId,
  senderName,
  messageContent,
  conversationId,
}: {
  receiverId: string;
  senderName: string;
  messageContent: string;
  conversationId: string;
}) {
  const results = await Promise.allSettled([
    sendChatPushNotification({
      receiverId,
      senderName,
      messageContent,
      conversationId,
    }),
    sendChatEmailNotification({
      receiverId,
      senderName,
      messageContent,
      conversationId,
    }),
  ]);

  results.forEach((result, idx) => {
    if (result.status === "rejected") {
      const channel = idx === 0 ? "Push" : "Email";
      console.error(`OneSignal unified notifications: ${channel} sending failed:`, result.reason);
    }
  });
}
