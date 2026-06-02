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
    console.warn("OneSignal Send Warn: Missing NEXT_PUBLIC_ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY in environment variables.");
    return;
  }

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://buykarlo.in";

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
      console.error("OneSignal API Error:", errText);
    }
  } catch (error) {
    console.error("OneSignal API Network Exception:", error);
  }
}
