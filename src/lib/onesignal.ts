import { sendChatEmailNotification } from "./email";

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

export async function sendChatNotifications({
  receiverId,
  receiverEmail,
  senderName,
  senderAvatarUrl,
  listingTitle,
  listingPrice,
  messageContent,
  conversationId,
}: {
  receiverId: string;
  receiverEmail?: string;
  senderName: string;
  senderAvatarUrl?: string;
  listingTitle: string;
  listingPrice?: string;
  messageContent: string;
  conversationId: string;
}) {
  const promises: Promise<any>[] = [
    sendChatPushNotification({
      receiverId,
      senderName,
      messageContent,
      conversationId,
    })
  ];

  if (receiverEmail) {
    promises.push(
      sendChatEmailNotification({
        toEmail: receiverEmail,
        senderName,
        senderAvatarUrl,
        listingTitle,
        listingPrice,
        messageContent,
        conversationId,
      })
    );
  } else {
    console.warn(`Skipping chat email notification to receiver ${receiverId} because receiverEmail is missing.`);
  }

  const results = await Promise.allSettled(promises);

  results.forEach((result, idx) => {
    if (result.status === "rejected") {
      const channel = idx === 0 ? "Push" : "Email";
      console.error(`Multi-channel unified notifications: ${channel} sending failed:`, result.reason);
    }
  });
}
