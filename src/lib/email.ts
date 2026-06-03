import { Resend } from "resend"

// Fallback sender address. Must match your verified domain.
const SENDER_EMAIL = "noreply@buykarlo.in"

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
        <title>Welcome to BuyKarlo 2.0</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
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
            padding: 35px 20px;
            text-align: center;
            color: #ffffff;
          }
          .header img {
            max-width: 80px;
            height: auto;
            margin-bottom: 12px;
            display: inline-block;
          }
          .header h1 {
            margin: 0;
            font-size: 26px;
            font-weight: 900;
            letter-spacing: -0.04em;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 12px;
            color: #0f172a;
          }
          .intro {
            font-size: 15px;
            line-height: 1.6;
            color: #64748b;
            margin-bottom: 30px;
          }
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          @media (max-width: 480px) {
            .grid {
              grid-template-columns: 1fr;
            }
          }
          .card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 24px;
            text-align: center;
            transition: all 0.2s ease;
          }
          .card h3 {
            margin-top: 0;
            margin-bottom: 8px;
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
          }
          .card p {
            font-size: 13px;
            color: #64748b;
            line-height: 1.5;
            margin-bottom: 16px;
          }
          .btn {
            display: inline-block;
            background: #1C16CF;
            color: #ffffff;
            text-decoration: none;
            padding: 10px 20px;
            font-size: 13px;
            font-weight: 700;
            border-radius: 9999px;
            transition: background 0.2s ease;
          }
          .btn-secondary {
            background: #6B38D4;
          }
          .footer {
            background: #f8fafc;
            padding: 20px 30px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
          }
          .footer a {
            color: #1c16cf;
            text-decoration: none;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://www.buykarlo.in/brand/buykarlo-mark.png" alt="BuyKarlo Logo" />
            <h1>BuyKarlo 2.0</h1>
            <p style="margin: 6px 0 0 0; opacity: 0.85; font-size: 13px; font-weight: 500;">Your Verified AMU Student Marketplace</p>
          </div>
          <div class="content">
            <div class="greeting">Hey ${fullName}! 👋</div>
            <div class="intro">
              Welcome to Aligarh Muslim University's official student peer-to-peer marketplace. 
              We're thrilled to have you! BuyKarlo helps you securely trade books, cycles, laptops, 
              and dorm gear with verified students on campus.
              <br><br>
              To get you started, we've prepared quick video tutorials to make buying and selling frictionless:
            </div>
            
            <div class="grid">
              <div class="card">
                <h3>🛍️ Buying Guide</h3>
                <p>Learn how to safely negotiate, arrange meetups, and pay on campus.</p>
                <a href="https://www.youtube.com/watch?v=mock-buyer-tutorial" class="btn" target="_blank">Watch Guide</a>
              </div>
              <div class="card">
                <h3>🏷️ Selling Guide</h3>
                <p>Learn how to upload products, chat with buyers, and secure deal completions.</p>
                <a href="https://www.youtube.com/watch?v=mock-seller-tutorial" class="btn btn-secondary" target="_blank">Watch Guide</a>
              </div>
            </div>

            <p style="font-size: 13px; color: #94a3b8; line-height: 1.5; text-align: center; margin: 0;">
              Pro tip: Completing deals and keeping listings updated boosts your student **Trust Score**!
            </p>
          </div>
          <div class="footer">
            Sent to you by BuyKarlo 2.0 at Aligarh Muslim University.<br>
            Need help? Reach out at <a href="mailto:support@buykarlo.com">support@buykarlo.com</a>.
          </div>
        </div>
      </body>
      </html>
    `

    const data = await resend.emails.send({
      from: `BuyKarlo <${SENDER_EMAIL}>`,
      to: toEmail,
      replyTo: "buykarlo.official@gmail.com",
      subject: "Welcome to BuyKarlo 2.0! 🎉",
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
            <h1>BuyKarlo 2.0</h1>
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
            BuyKarlo 2.0 • Aligarh Muslim University
          </div>
        </div>
      </body>
      </html>
    `

    const data = await resend.emails.send({
      from: `BuyKarlo <${SENDER_EMAIL}>`,
      to: toEmail,
      replyTo: "buykarlo.official@gmail.com",
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
