import { NextRequest, NextResponse } from "next/server"
import { extractWebsiteMetadata, generatePackageId } from "@/lib/metadata-extractor"
import JSZip from "jszip"

export const maxDuration = 60 // Allow up to 60 seconds for APK generation

interface CloudAPKRequest {
  packageId: string
  name: string
  launcherName: string
  appVersion: string
  appVersionCode: number
  host: string
  startUrl: string
  iconUrl: string
  themeColor: string
  navigationColor: string
  backgroundColor: string
  display: string
  orientation: string
  enableNotifications: boolean
  enableSiteSettingsShortcut: boolean
  isChromeOSOnly: boolean
  fallbackType: string
  splashScreenFadeOutDuration: number
  signingMode: string
  signing: null
  webManifestUrl: string
  manifestUrl: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, appName, themeColor, backgroundColor, iconUrl } = body

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      )
    }

    // Validate URL
    let validUrl: URL
    try {
      validUrl = new URL(url)
      if (!validUrl.protocol.startsWith('http')) {
        throw new Error('Invalid protocol')
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid URL. Please provide a valid HTTP/HTTPS URL." },
        { status: 400 }
      )
    }

    // Extract metadata from the website
    const metadata = await extractWebsiteMetadata(url)
    
    // Allow user overrides
    const finalAppName = appName || metadata.title
    const finalThemeColor = themeColor || metadata.themeColor
    const finalBackgroundColor = backgroundColor || metadata.backgroundColor
    const finalIconUrl = iconUrl || metadata.iconUrl
    const packageId = generatePackageId(url)
    
    // Truncate app name for launcher (max 12 chars recommended)
    const launcherName = finalAppName.length > 12 
      ? finalAppName.substring(0, 12).trim() 
      : finalAppName

    // Get the host URL for this request (for generating manifest URL)
    const protocol = request.headers.get("x-forwarded-proto") || "https"
    const host = request.headers.get("host") || "localhost:3000"
    const baseUrl = `${protocol}://${host}`

    // Use the site's manifest if available, otherwise generate one dynamically
    let manifestUrl = metadata.manifestUrl
    if (!manifestUrl) {
      // Generate a dynamic manifest URL using our API
      const manifestParams = new URLSearchParams({
        name: finalAppName,
        start_url: metadata.startUrl,
        theme_color: finalThemeColor,
        background_color: finalBackgroundColor,
        icon_url: finalIconUrl
      })
      manifestUrl = `${baseUrl}/api/manifest?${manifestParams.toString()}`
    }

    console.log("[v0] Using manifest URL:", manifestUrl)

    // Prepare CloudAPK request
    const cloudAPKRequest: CloudAPKRequest = {
      packageId,
      name: finalAppName,
      launcherName,
      appVersion: "1.0.0.0",
      appVersionCode: 1,
      host: metadata.host,
      startUrl: metadata.startUrl,
      iconUrl: finalIconUrl,
      themeColor: finalThemeColor,
      navigationColor: finalThemeColor,
      backgroundColor: finalBackgroundColor,
      display: "standalone",
      orientation: "any",
      enableNotifications: false,
      enableSiteSettingsShortcut: false,
      isChromeOSOnly: false,
      fallbackType: "customtabs",
      splashScreenFadeOutDuration: 300,
      signingMode: "none",
      signing: null,
      webManifestUrl: manifestUrl,
      manifestUrl: manifestUrl
    }

    // Call PWABuilder CloudAPK service
    const cloudAPKResponse = await fetch(
      "https://pwabuilder-cloudapk.azurewebsites.net/generateAppPackage",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(cloudAPKRequest)
      }
    )

    if (!cloudAPKResponse.ok) {
      const errorText = await cloudAPKResponse.text()
      console.error("CloudAPK error:", errorText)
      
      // Try to parse error message
      let errorMessage = "Failed to generate APK"
      try {
        const errorJson = JSON.parse(errorText)
        if (errorJson.message) errorMessage = errorJson.message
        if (errorJson.error) errorMessage = errorJson.error
      } catch {
        if (errorText.length < 200) errorMessage = errorText
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: cloudAPKResponse.status }
      )
    }

    // The response is a ZIP file containing APK and AAB
    const zipBuffer = await cloudAPKResponse.arrayBuffer()
    
    // Extract APK from the ZIP
    const zip = await JSZip.loadAsync(zipBuffer)
    
    // Find the APK file in the ZIP
    let apkFile: JSZip.JSZipObject | null = null
    let apkFileName = ""
    
    zip.forEach((relativePath, file) => {
      if (relativePath.endsWith('.apk') && !file.dir) {
        apkFile = file
        apkFileName = relativePath
      }
    })

    if (!apkFile) {
      // If no APK found, return the whole ZIP
      return new NextResponse(zipBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${launcherName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-app.zip"`,
          "X-APK-Package-Id": packageId,
          "X-APK-App-Name": finalAppName
        }
      })
    }

    // Extract APK content
    const apkContent = await apkFile.async("arraybuffer")

    // Return APK file directly
    return new NextResponse(apkContent, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Disposition": `attachment; filename="${launcherName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.apk"`,
        "X-APK-Package-Id": packageId,
        "X-APK-App-Name": finalAppName
      }
    })

  } catch (error) {
    console.error("APK generation error:", error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to generate APK",
        fallback: true 
      },
      { status: 500 }
    )
  }
}
