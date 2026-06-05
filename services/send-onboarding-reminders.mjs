import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// 1. Load environment variables from .env manually
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../.env')

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=')
      const key = parts[0]?.trim()
      let val = parts.slice(1).join('=').trim()
      // strip quotes if present
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1)
      if (key && val) {
        process.env[key] = val
      }
    }
  })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const resendApiKey = process.env.RESEND_API_KEY
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.buykarlo.in'

if (!supabaseUrl || !supabaseAnonKey || !resendApiKey) {
  console.error('Missing configuration in .env file!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)
const resend = new Resend(resendApiKey)

const emailTemplate = (fullName) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Complete your BuyKarlo Profile</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #1e293b;
    }

    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 28px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 18px 45px rgba(28, 22, 207, 0.06);
    }

    .header {
      background: linear-gradient(135deg, #1C16CF 0%, #6B38D4 100%);
      padding: 38px 24px;
      text-align: center;
      color: #ffffff;
    }

    .header img {
      max-width: 70px;
      margin-bottom: 14px;
    }

    .header h1 {
      margin: 0;
      font-size: 26px;
      font-weight: 900;
      letter-spacing: -0.04em;
    }

    .content {
      padding: 38px 30px;
      text-align: center;
    }

    .greeting {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 12px;
      text-align: left;
    }

    .text {
      font-size: 15px;
      line-height: 1.7;
      color: #64748b;
      margin-bottom: 30px;
      text-align: left;
    }

    .cta-box {
      margin: 28px 0;
      padding: 10px 0;
    }

    .btn {
      display: inline-block;
      background: #1C16CF;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      font-size: 15px;
      font-weight: 800;
      border-radius: 999px;
      box-shadow: 0 10px 20px rgba(28, 22, 207, 0.2);
    }

    .features-list {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 20px 24px;
      margin-top: 30px;
      text-align: left;
    }

    .features-list h3 {
      margin: 0 0 12px;
      font-size: 14px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #0f172a;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      color: #475569;
      margin-bottom: 8px;
    }

    .feature-item:last-child {
      margin-bottom: 0;
    }

    .footer {
      background: #f8fafc;
      padding: 24px;
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
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://www.buykarlo.in/brand/buykarlo-mark.png" alt="BuyKarlo Logo">
      <h1>BuyKarlo</h1>
    </div>

    <div class="content">
      <div class="greeting">Hey ${fullName || 'there'}! 👋</div>
      <div class="text">
        We noticed you signed up for BuyKarlo but haven't finished setting up your campus profile. 
        <br><br>
        To protect our student network, only verified students can make offers, chat with sellers, or list items. Completing your profile takes less than 30 seconds!
      </div>

      <div class="cta-box">
        <a href="${siteUrl}/onboarding" class="btn" target="_blank">Complete Onboarding Now</a>
      </div>

      <div class="features-list">
        <h3>Unlock full student features:</h3>
        <div class="feature-item">🔑 Verified student-only trading network</div>
        <div class="feature-item">💬 Negotiate directly in real-time chat</div>
        <div class="feature-item">🛡️ Safe canteens & libraries meetup markers</div>
        <div class="feature-item">🏷️ List pre-owned books, cycles, and gadgets for free</div>
      </div>
    </div>

    <div class="footer">
      © 2026 BuyKarlo · Verified Student Marketplace<br>
      Need help? Reach out at <a href="mailto:help@buykarlo.in">help@buykarlo.in</a>
    </div>
  </div>
</body>
</html>
`

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function run() {
  console.log('Fetching profiles with incomplete onboarding...')
  
  // Query users where phone is null (onboarding incomplete)
  const { data: incompleteProfiles, error } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .is('phone', null)

  if (error) {
    console.error('Failed to query profiles:', error)
    process.exit(1)
  }

  if (!incompleteProfiles || incompleteProfiles.length === 0) {
    console.log('No incomplete onboarding profiles found!')
    return
  }

  console.log(`Found ${incompleteProfiles.length} incomplete onboarding profiles.`)
  
  for (const profile of incompleteProfiles) {
    if (!profile.email) {
      console.warn(`Skipping profile ${profile.id}: missing email.`)
      continue
    }

    const name = profile.full_name || ''
    console.log(`Sending onboarding reminder to ${profile.email}...`)

    try {
      const response = await resend.emails.send({
        from: 'BuyKarlo <help@buykarlo.in>',
        to: profile.email,
        replyTo: 'help@buykarlo.in',
        subject: 'Complete your BuyKarlo profile 🚀',
        html: emailTemplate(name),
      })
      console.log(`Success for ${profile.email}:`, response)
    } catch (err) {
      console.error(`Failed to send email to ${profile.email}:`, err)
    }

    // Delay 600ms between sends to protect Resend free tier rate limit
    await delay(600)
  }

  console.log('Finished dispatching onboarding reminders.')
}

run()
