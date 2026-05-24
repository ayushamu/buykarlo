import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

// Initialize S3 Client pointing to Cloudflare R2
const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to upload files." },
        { status: 401 }
      )
    }

    // 2. Parse request payload
    const { filename, contentType } = await request.json()

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: "Missing filename or contentType parameter." },
        { status: 400 }
      )
    }

    // 3. Generate a unique key for the file
    const fileExtension = filename.split(".").pop() || "jpg"
    const uniqueId = crypto.randomUUID()
    const fileKey = `listings/${user.id}/${uniqueId}.${fileExtension}`

    // 4. Generate pre-signed PUT URL
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: fileKey,
      ContentType: contentType,
    })

    // URL expires in 15 minutes (900 seconds)
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 })

    // Construct the public URL using the R2 custom domain/public bucket URL
    const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${fileKey}`

    return NextResponse.json({
      uploadUrl,
      publicUrl,
      fileKey,
    })
  } catch (error) {
    console.error("Presign URL Generation Error:", error)
    return NextResponse.json(
      { error: "Internal Server Error occurred while generating upload URL." },
      { status: 500 }
    )
  }
}
