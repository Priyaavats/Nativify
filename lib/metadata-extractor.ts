export interface WebsiteMetadata {
  title: string
  themeColor: string
  backgroundColor: string
  iconUrl: string
  description: string
  host: string
  startUrl: string
}

/**
 * Extracts metadata from a website URL for APK generation
 */
export async function extractWebsiteMetadata(url: string): Promise<WebsiteMetadata> {
  const parsedUrl = new URL(url)
  const host = parsedUrl.origin
  
  // Default values
  let title = parsedUrl.hostname.replace(/^www\./, '').split('.')[0]
  title = title.charAt(0).toUpperCase() + title.slice(1)
  let themeColor = "#4F46E5"
  let backgroundColor = "#0F0F1A"
  let iconUrl = ""
  let description = ""

  try {
    // Fetch the website HTML
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Nativify/1.0; +https://nativify.dev)"
      }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.status}`)
    }
    
    const html = await response.text()
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    if (titleMatch) {
      title = titleMatch[1].trim()
      // Truncate long titles
      if (title.length > 30) {
        title = title.substring(0, 30).trim()
      }
    }
    
    // Extract meta description
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)
    if (descMatch) {
      description = descMatch[1].trim()
    }
    
    // Extract theme color
    const themeColorMatch = html.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']theme-color["']/i)
    if (themeColorMatch) {
      themeColor = themeColorMatch[1].trim()
    }
    
    // Extract background color from msapplication-TileColor or use theme color
    const bgColorMatch = html.match(/<meta[^>]+name=["']msapplication-TileColor["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']msapplication-TileColor["']/i)
    if (bgColorMatch) {
      backgroundColor = bgColorMatch[1].trim()
    } else if (themeColorMatch) {
      backgroundColor = themeColor
    }
    
    // Try to find web manifest
    const manifestMatch = html.match(/<link[^>]+rel=["']manifest["'][^>]+href=["']([^"']+)["']/i)
      || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']manifest["']/i)
    
    if (manifestMatch) {
      const manifestUrl = new URL(manifestMatch[1], host).href
      try {
        const manifestResponse = await fetch(manifestUrl)
        if (manifestResponse.ok) {
          const manifest = await manifestResponse.json()
          
          if (manifest.name) title = manifest.name
          else if (manifest.short_name) title = manifest.short_name
          
          if (manifest.theme_color) themeColor = manifest.theme_color
          if (manifest.background_color) backgroundColor = manifest.background_color
          if (manifest.description) description = manifest.description
          
          // Get the best icon from manifest
          if (manifest.icons && manifest.icons.length > 0) {
            // Sort by size, prefer larger icons
            const sortedIcons = manifest.icons
              .filter((icon: { sizes?: string }) => icon.sizes)
              .sort((a: { sizes: string }, b: { sizes: string }) => {
                const aSize = parseInt(a.sizes.split('x')[0]) || 0
                const bSize = parseInt(b.sizes.split('x')[0]) || 0
                return bSize - aSize
              })
            
            if (sortedIcons.length > 0) {
              iconUrl = new URL(sortedIcons[0].src, host).href
            } else if (manifest.icons[0].src) {
              iconUrl = new URL(manifest.icons[0].src, host).href
            }
          }
        }
      } catch {
        // Manifest fetch failed, continue with fallbacks
      }
    }
    
    // Fallback icon detection if no manifest icon found
    if (!iconUrl) {
      // Try apple-touch-icon first (usually high quality)
      const appleTouchIcon = html.match(/<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)["']/i)
        || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']apple-touch-icon["']/i)
      
      if (appleTouchIcon) {
        iconUrl = new URL(appleTouchIcon[1], host).href
      } else {
        // Try any icon
        const iconMatch = html.match(/<link[^>]+rel=["']icon["'][^>]+href=["']([^"']+)["']/i)
          || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']icon["']/i)
        
        if (iconMatch) {
          iconUrl = new URL(iconMatch[1], host).href
        } else {
          // Last resort: try favicon.ico
          iconUrl = `${host}/favicon.ico`
        }
      }
    }
    
  } catch (error) {
    console.error("Error extracting metadata:", error)
    // Use defaults with favicon fallback
    iconUrl = `${host}/favicon.ico`
  }

  return {
    title,
    themeColor,
    backgroundColor,
    iconUrl,
    description,
    host,
    startUrl: parsedUrl.pathname || "/"
  }
}

/**
 * Generates a valid Android package ID from a URL
 */
export function generatePackageId(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '')
    // Reverse domain notation
    const parts = hostname.split('.').reverse()
    // Clean each part to be valid Java identifier
    const cleanParts = parts.map(part => 
      part.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/^[0-9]/, 'n')
    ).filter(Boolean)
    
    // Ensure we have at least com.nativify.app
    if (cleanParts.length < 2) {
      cleanParts.unshift('nativify', 'com')
    } else if (cleanParts.length < 3) {
      cleanParts.push('app')
    }
    
    return cleanParts.join('.')
  } catch {
    return 'com.nativify.app'
  }
}
