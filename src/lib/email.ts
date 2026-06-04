import { Resend } from "resend"

// Fallback sender address. Must match your verified domain.
const SENDER_EMAIL = "help@buykarlo.in"

/**
 * Sends a premium styled Welcome Email upon completing onboarding,
 * containing video tutorial links for buying and selling products on BuyKarlo.
 */
export async function sendWelcomeEmail(toEmail: string, fullName: string) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY is not defined. Skipping welcome email dispatch.")
      return { success: false, error: "API key missing" }
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    const emailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to BuyKarlo</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            background: #f8fafc;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            color: #1e293b;
          }

          .container {
            max-width: 620px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 28px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
            box-shadow: 0 18px 45px rgba(28, 22, 207, 0.08);
          }

          .header {
            background: linear-gradient(135deg, #1C16CF 0%, #6B38D4 100%);
            padding: 38px 24px;
            text-align: center;
            color: #ffffff;
          }

          .header img {
            max-width: 78px;
            margin-bottom: 14px;
          }

          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 900;
            letter-spacing: -0.04em;
          }

          .header p {
            margin: 8px 0 0;
            font-size: 14px;
            opacity: 0.9;
            font-weight: 500;
          }

          .content {
            padding: 38px 30px;
          }

          .greeting {
            font-size: 21px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 12px;
          }

          .intro {
            font-size: 15px;
            line-height: 1.7;
            color: #64748b;
            margin-bottom: 30px;
          }

          .section-title {
            text-align: center;
            font-size: 18px;
            font-weight: 900;
            color: #0f172a;
            margin-bottom: 22px;
          }

          .flow-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 22px;
            padding: 24px;
            margin-bottom: 22px;
          }

          .flow-card.buy {
            border-top: 5px solid #1C16CF;
          }

          .flow-card.sell {
            border-top: 5px solid #6B38D4;
          }

          .flow-heading {
            font-size: 18px;
            font-weight: 900;
            margin: 0 0 18px;
            color: #0f172a;
          }

          .step {
            display: flex;
            gap: 14px;
            margin-bottom: 16px;
            align-items: flex-start;
          }

          .step:last-child {
            margin-bottom: 0;
          }

          .icon {
            min-width: 42px;
            height: 42px;
            border-radius: 14px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            box-shadow: 0 6px 14px rgba(15, 23, 42, 0.05);
          }

          .step-content h3 {
            margin: 0 0 4px;
            font-size: 15px;
            color: #0f172a;
            font-weight: 800;
          }

          .step-content p {
            margin: 0;
            font-size: 13.5px;
            line-height: 1.55;
            color: #64748b;
          }

          .cta-box {
            margin-top: 28px;
            padding: 24px;
            border-radius: 22px;
            background: linear-gradient(135deg, rgba(28,22,207,0.08), rgba(107,56,212,0.10));
            text-align: center;
            border: 1px solid #ddd6fe;
          }

          .cta-box h2 {
            margin: 0 0 8px;
            font-size: 19px;
            color: #0f172a;
            font-weight: 900;
          }

          .cta-box p {
            margin: 0 0 18px;
            color: #64748b;
            font-size: 14px;
            line-height: 1.6;
          }

          .btn {
            display: inline-block;
            background: #1C16CF;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 24px;
            font-size: 14px;
            font-weight: 800;
            border-radius: 999px;
          }

          .trust-note {
            margin-top: 24px;
            text-align: center;
            font-size: 13px;
            color: #94a3b8;
            line-height: 1.6;
          }

          .footer {
            background: #f8fafc;
            padding: 22px 30px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
            line-height: 1.6;
          }

          .footer a {
            color: #1C16CF;
            text-decoration: none;
            font-weight: 700;
          }

          @media (max-width: 520px) {
            .container {
              margin: 20px 12px;
              border-radius: 22px;
            }

            .content {
              padding: 30px 20px;
            }

            .step {
              gap: 12px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">

          <div class="header">
            <img src="https://www.buykarlo.in/brand/buykarlo-mark.png" alt="BuyKarlo Logo">
            <h1>BuyKarlo</h1>
            <p>Your Verified AMU Student Marketplace</p>
          </div>

          <div class="content">
            <div class="greeting">Hey \${fullName}! 👋</div>

            <div class="intro">
              Welcome to BuyKarlo — a student-first marketplace built for Aligarh Muslim University.
              Buy books, cycles, gadgets, hostel essentials, and more from verified students around campus.
              <br><br>
              Here’s how buying and selling works in a few simple steps:
            </div>

            <div class="section-title">How BuyKarlo Works</div>

            <div class="flow-card buy">
              <h2 class="flow-heading">🛍️ Want to Buy?</h2>

              <div class="step">
                <div class="icon">🔎</div>
                <div class="step-content">
                  <h3>Explore Listings</h3>
                  <p>Browse products listed by verified AMU students — from books to daily campus essentials.</p>
                </div>
              </div>

              <div class="step">
                <div class="icon">💬</div>
                <div class="step-content">
                  <h3>Chat with Seller</h3>
                  <p>Ask questions, negotiate price, and confirm the condition of the product directly.</p>
                </div>
              </div>

              <div class="step">
                <div class="icon">📍</div>
                <div class="step-content">
                  <h3>Meet on Campus</h3>
                  <p>Choose a safe campus spot, check the product, and complete the deal in person.</p>
                </div>
              </div>
            </div>

            <div class="flow-card sell">
              <h2 class="flow-heading">🏷️ Want to Sell?</h2>

              <div class="step">
                <div class="icon">📸</div>
                <div class="step-content">
                  <h3>Upload Product</h3>
                  <p>Add photos, price, category, and basic details of the item you want to sell.</p>
                </div>
              </div>

              <div class="step">
                <div class="icon">✨</div>
                <div class="step-content">
                  <h3>Improve Your Listing</h3>
                  <p>Write a clear description, mention condition honestly, and make your product easy to discover.</p>
                </div>
              </div>

              <div class="step">
                <div class="icon">🤝</div>
                <div class="step-content">
                  <h3>Chat, Meet, Sell</h3>
                  <p>Respond to buyers, fix a campus meetup point, and complete the sale smoothly.</p>
                </div>
              </div>
            </div>

            <div class="cta-box">
              <h2>Start exploring BuyKarlo today 🚀</h2>
              <p>Find useful products nearby or list something you no longer need.</p>
              <a href="https://www.buykarlo.in" class="btn" target="_blank">Open BuyKarlo</a>
            </div>

            <div class="trust-note">
              Pro tip: Honest listings, quick replies, and smooth deals help build your student trust on BuyKarlo.
            </div>
          </div>

          <div class="footer">
            © 2026 BuyKarlo · Verified Student-only P2P Marketplace<br>
            Need help? Reach out at <a href="mailto:help@buykarlo.in">help@buykarlo.in</a>
          </div>

        </div>
      </body>
      </html>
    `

    const data = await resend.emails.send({
      from: `BuyKarlo <${SENDER_EMAIL}>`,
      to: toEmail,
      replyTo: "help@buykarlo.in",
      subject: "Welcome to BuyKarlo! 🎉",
      html: emailContent,
    })

    console.log("Welcome email sent successfully:", data)
    return { success: true, data }
  } catch (error: any) {
    console.error("Failed to send welcome email:", error)
    return { success: false, error: error.message || error }
  }
}

/**
 * Sends a Deal Review reminder email, prompting either the Buyer or Seller
 * to leave feedback for the transaction partner.
 */
export async function sendReviewReminderEmail(
  toEmail: string,
  otherPartyName: string,
  listingTitle: string,
  dealId: string,
  role: "buyer" | "seller"
) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY is not defined. Skipping review reminder email dispatch.")
      return { success: false, error: "API key missing" }
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    const reviewLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/review/${dealId}`

    const subject = role === "buyer" 
      ? `Rate your experience buying "${listingTitle}"! ⭐`
      : `Rate your experience selling to ${otherPartyName}! ⭐`

    const bodyHeadline = role === "buyer"
      ? `How was your purchase of "${listingTitle}"?`
      : `Congratulations on selling "${listingTitle}"!`

    const bodyText = role === "buyer"
      ? `We hope you liked the item! Please rate your experience dealing with **${otherPartyName}** (Seller). Leaving feedback helps keep the AMU student community verified and trustworthy.`
      : `You completed a campus deal with **${otherPartyName}** (Buyer). Please take a brief moment to rate them. Your reviews directly update their student Trust Score!`

    const emailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Leave a Review</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(28, 22, 207, 0.05);
            border: 1px solid #e2e8f0;
          }
          .header {
            background: linear-gradient(135deg, #1C16CF 0%, #6B38D4 100%);
            padding: 30px 20px;
            text-align: center;
            color: #ffffff;
          }
          .header img {
            max-width: 60px;
            height: auto;
            margin-bottom: 10px;
            display: inline-block;
          }
          .header h1 {
            margin: 0;
            font-size: 22px;
            font-weight: 900;
            letter-spacing: -0.04em;
          }
          .content {
            padding: 40px 30px;
            text-align: center;
          }
          .headline {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 16px;
            color: #0f172a;
          }
          .text {
            font-size: 15px;
            line-height: 1.6;
            color: #64748b;
            margin-bottom: 30px;
            text-align: left;
          }
          .btn {
            display: inline-block;
            background: #6B38D4;
            color: #ffffff;
            text-decoration: none;
            padding: 14px 32px;
            font-size: 15px;
            font-weight: 700;
            border-radius: 9999px;
            box-shadow: 0 8px 16px rgba(107, 56, 212, 0.2);
            transition: all 0.2s ease;
          }
          .footer {
            background: #f8fafc;
            padding: 20px 30px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://www.buykarlo.in/brand/buykarlo-mark.png" alt="BuyKarlo Logo" />
            <h1>BuyKarlo</h1>
          </div>
          <div class="content">
            <div class="headline">${bodyHeadline}</div>
            <div class="text">
              ${bodyText}
            </div>
            
            <a href="${reviewLink}" class="btn" target="_blank">Leave a Review Now</a>
            
            <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">
              Your response is stored securely and linked to the campus directory trust matrix.
            </p>
          </div>
          <div class="footer">
            BuyKarlo • Aligarh Muslim University<br>
            Need help? Reach out at <a href="mailto:help@buykarlo.in" style="color: #1C16CF; text-decoration: none; font-weight: 700;">help@buykarlo.in</a>
          </div>
        </div>
      </body>
      </html>
    `

    const data = await resend.emails.send({
      from: `BuyKarlo <${SENDER_EMAIL}>`,
      to: toEmail,
      replyTo: "help@buykarlo.in",
      subject: subject,
      html: emailContent,
    })

    console.log(`Review reminder email sent to ${toEmail}:`, data)
    return { success: true, data }
  } catch (error: any) {
    console.error(`Failed to send review email to ${toEmail}:`, error)
    return { success: false, error: error.message || error }
  }
}

/**
 * Sends an email notification when a user receives a chat message on BuyKarlo.
 */
export async function sendChatEmailNotification({
  toEmail,
  senderName,
  senderAvatarUrl,
  listingTitle,
  listingPrice,
  messageContent,
  conversationId,
}: {
  toEmail: string;
  senderName: string;
  senderAvatarUrl?: string;
  listingTitle: string;
  listingPrice?: string;
  messageContent: string;
  conversationId: string;
}) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY is not defined. Skipping chat email notification.")
      return { success: false, error: "API key missing" }
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.buykarlo.in"
    const chatUrl = `${siteUrl}/messages?conversationId=${conversationId}`

    const truncatedMessage = messageContent.length > 150
      ? `${messageContent.substring(0, 147)}...`
      : messageContent;

    // Use UI-Avatars as fallback if user has no avatar
    const avatarUrl = senderAvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=1C16CF&color=fff&rounded=true&bold=true`;
    const studentHandle = `${senderName.replace(/\s+/g, '_').toLowerCase()}`;

    const emailSubject = `New message from ${senderName} on BuyKarlo 💬`
    const emailBody = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Message on BuyKarlo</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0B0F19;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #0B0F19;
      padding: 16px 12px;
      box-sizing: border-box;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #111827;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .header {
      padding: 12px 24px 0 24px;
      display: table;
      width: 100%;
      box-sizing: border-box;
    }
    .logo-container {
      display: table-cell;
      vertical-align: middle;
    }
    .logo-text {
      color: #ffffff;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.5px;
      text-decoration: none;
      margin: 0;
    }
    .user-tag-container {
      display: table-cell;
      text-align: right;
      vertical-align: middle;
    }
    .user-tag {
      font-size: 13px;
      color: #64748b;
      font-weight: 500;
    }
    .content {
      padding: 12px 24px 24px 24px;
    }
    .avatar-image {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      border: 3px solid #1C16CF;
      display: block;
      margin: 0 auto 16px auto;
    }
    .notification-line {
      text-align: center;
      color: #94a3b8;
      font-size: 14px;
      margin-bottom: 18px;
      line-height: 1.5;
    }
    .notification-line a {
      color: #38bdf8;
      text-decoration: none;
      font-weight: 700;
    }
    .context-card {
      background-color: #1e293b;
      border-left: 4px solid #1C16CF;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 18px;
      border-top: 1px solid rgba(255, 255, 255, 0.03);
      border-right: 1px solid rgba(255, 255, 255, 0.03);
      border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    }
    .context-label {
      font-size: 11px;
      font-weight: bold;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .context-title {
      font-size: 15px;
      font-weight: 700;
      color: #ffffff;
      margin: 0;
    }
    .context-price {
      font-size: 13px;
      color: #a855f7;
      font-weight: 600;
      margin-top: 4px;
      margin-bottom: 0;
    }
    .separator {
      border: 0;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      margin: 20px 0;
    }
    .message-container {
      margin-bottom: 28px;
      text-align: left;
    }
    .message-author {
      font-size: 13px;
      font-weight: bold;
      color: #94a3b8;
      margin-bottom: 6px;
    }
    .message-bubble {
      background-color: #1f2937;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 14px 18px;
      margin-top: 6px;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
    }
    .message-body {
      font-size: 15px;
      color: #ffffff;
      line-height: 1.5;
      margin: 0;
      font-weight: 500;
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
      padding: 12px 36px;
      border-radius: 9999px;
      box-shadow: 0 4px 15px rgba(28, 22, 207, 0.4);
    }
    .footer {
      padding: 32px;
      text-align: center;
      background-color: #0b0f19;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
    .footer-text {
      font-size: 11px;
      color: #64748b;
      line-height: 1.6;
      margin: 0;
    }
    .footer-link {
      color: #38bdf8;
      text-decoration: none;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo-container">
          <div class="logo-text"><a href="${siteUrl}">
  <img src="https://res.cloudinary.com/dqariamo7/image/upload/v1780594833/22577176-a49c-49a3-a7ae-5ada9284b795.png" width="80" height="64" alt="Company Logo Home Button">
</a></div>
        </div>
        <div class="user-tag-container">
          <div class="user-tag">student_inbox</div>
        </div>
      </div>
      <div class="content">
        <img src="${avatarUrl}" class="avatar-image" alt="${senderName}" />
        
        <div class="notification-line">
          <a href="${chatUrl}">${senderName}</a> sent you a new message &middot; Just now
        </div>
        
        <div class="context-card">
          <div class="context-label">Conversation Item</div>
          <h4 class="context-title">${listingTitle}</h4>
          ${listingPrice ? `<p class="context-price">${listingPrice}</p>` : ""}
        </div>
        
        <hr class="separator" />
        
        <div class="message-container">
          <div class="message-author">student/${studentHandle}</div>
          <div class="message-bubble">
            <p class="message-body">"${truncatedMessage}"</p>
          </div>
        </div>
        
        <div class="button-container">
          <a href="${chatUrl}" class="btn" style="color: #ffffff !important; text-decoration: none;">Reply in Chat</a>
        </div>
      </div>
      <div class="footer">
        <p class="footer-text">
         © 2026 BuyKarlo · Verified Student-only P2P Marketplace<br>
          Need help? Reach out at <a href="mailto:help@buykarlo.in" class="footer-link">help@buykarlo.in</a><br>
          If you don't want to receive these emails, you can update your notification settings in your profile.<br>
          <a href="${siteUrl}" class="footer-link">Visit BuyKarlo</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`

    const data = await resend.emails.send({
      from: `BuyKarlo <${SENDER_EMAIL}>`,
      to: toEmail,
      replyTo: "help@buykarlo.in",
      subject: emailSubject,
      html: emailBody,
    })

    console.log(`Chat email notification sent to ${toEmail}:`, data)
    return { success: true, data }
  } catch (error: any) {
    console.error(`Failed to send chat email notification to ${toEmail}:`, error)
    return { success: false, error: error.message || error }
  }
}
