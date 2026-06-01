/**
 * Compresses an image file client-side using HTML5 Canvas.
 * Resizes the image so that neither its width nor height exceeds maxDimension.
 * Converts it to a compressed JPEG to optimize transfer size and load times.
 * 
 * @param file The original File object selected by the user.
 * @param maxDimension The maximum allowed width or height in pixels. Default is 1200.
 * @param quality The JPEG compression quality (between 0.0 and 1.0). Default is 0.75.
 * @returns A Promise that resolves to a new compressed File object, or the original file if compression fails/is skipped.
 */
export function compressImage(file: File, maxDimension = 1200, quality = 0.75): Promise<File> {
  return new Promise((resolve) => {
    // Only compress image files
    if (!file.type.startsWith("image/")) {
      return resolve(file)
    }

    const reader = new FileReader()
    reader.readAsDataURL(file)

    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string

      img.onload = () => {
        const canvas = document.createElement("canvas")
        let width = img.width
        let height = img.height

        // Downscale dimension if it exceeds the maximum size
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          return resolve(file)
        }

        // Draw image onto the canvas (resizing it)
        ctx.drawImage(img, 0, 0, width, height)

        // Convert the canvas drawing to a compressed JPEG Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file)
            }

            // Create a new File from the blob, replacing extension with .jpg
            const baseName = file.name.replace(/\.[^/.]+$/, "")
            const compressedName = `${baseName || "upload"}.jpg`
            
            const compressedFile = new File([blob], compressedName, {
              type: "image/jpeg",
              lastModified: Date.now(),
            })

            console.log(`[compressImage] Compressed "${file.name}" (${(file.size / 1024 / 1024).toFixed(2)} MB) -> "${compressedName}" (${(compressedFile.size / 1024 / 1024).toFixed(2)} MB)`)
            resolve(compressedFile)
          },
          "image/jpeg",
          quality
        )
      }

      img.onerror = () => {
        console.warn("[compressImage] Failed to load image element, skipping compression.")
        resolve(file)
      }
    }

    reader.onerror = (error) => {
      console.warn("[compressImage] Failed to read file data, skipping compression:", error)
      resolve(file)
    }
  })
}
