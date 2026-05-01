import { NextRequest, NextResponse } from "next/server"

/**
 * Dynamic manifest generator for websites without a web app manifest
 * This endpoint creates a valid PWA manifest on-the-fly
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const name = searchParams.get("name") || "App"
  const startUrl = searchParams.get("start_url") || "/"
  const themeColor = searchParams.get("theme_color") || "#4F46E5"
  const backgroundColor = searchParams.get("background_color") || "#0F0F1A"
  const iconUrl = searchParams.get("icon_url") || ""

  const manifest = {
    name,
    short_name: name.length > 12 ? name.substring(0, 12).trim() : name,
    start_url: startUrl,
    display: "standalone",
    orientation: "any",
    theme_color: themeColor,
    background_color: backgroundColor,
    icons: iconUrl ? [
      {
        src: iconUrl,
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: iconUrl,
        sizes: "192x192",
        type: "image/png"
      }
    ] : []
  }

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Access-Control-Allow-Origin": "*"
    }
  })
}
