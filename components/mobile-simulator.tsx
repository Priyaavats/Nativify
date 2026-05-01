"use client"

import { useState, useMemo } from "react"
import { Download, Copy, Check, Smartphone, Tablet, ExternalLink, Package, FileCode, Settings, Terminal, Loader2, CheckCircle2, XCircle, Play } from "lucide-react"
import JSZip from "jszip"
import { saveAs } from "file-saver"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

interface MobileSimulatorProps {
  url: string
}

type ViewMode = "phone" | "tablet"
type TabType = "preview" | "app.js" | "app.json" | "package.json" | "eas.json"
type BuildStatus = "idle" | "starting" | "queued" | "building" | "finished" | "error"

interface BuildState {
  status: BuildStatus
  buildId?: string
  snackId?: string
  snackUrl?: string
  artifactUrl?: string
  expoUrl?: string
  message: string
  instructions?: string[]
}

// Generate React Native code with WebView for the user's URL
function generateAppCode(websiteUrl: string): string {
  return `import React, { useState, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator, SafeAreaView, StatusBar, Platform, BackHandler, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const webViewRef = useRef(null);

  const handleBack = () => {
    if (webViewRef.current) {
      webViewRef.current.goBack();
      return true;
    }
    return false;
  };

  React.useEffect(() => {
    if (Platform.OS === 'android') {
      BackHandler.addEventListener('hardwareBackPress', handleBack);
      return () => BackHandler.removeEventListener('hardwareBackPress', handleBack);
    }
  }, []);

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => setError(false)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F1A" />
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ uri: '${websiteUrl}' }}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => setError(true)}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsBackForwardNavigationGestures={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  webview: {
    flex: 1,
  },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0F1A',
    zIndex: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0F1A',
  },
  errorText: {
    color: '#F5F5F5',
    fontSize: 18,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});`
}

// Generate app.json for Expo
function generateAppJson(websiteUrl: string): object {
  let appName = "myapp"
  try {
    appName = new URL(websiteUrl).hostname.replace(/^www\./, '').split('.')[0]
  } catch {
    appName = "myapp"
  }
  return {
    expo: {
      name: appName.charAt(0).toUpperCase() + appName.slice(1),
      slug: appName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      version: "1.0.0",
      orientation: "portrait",
      icon: "./assets/icon.png",
      userInterfaceStyle: "automatic",
      splash: {
        image: "./assets/splash.png",
        resizeMode: "contain",
        backgroundColor: "#0F0F1A"
      },
      assetBundlePatterns: ["**/*"],
      ios: {
        supportsTablet: true,
        bundleIdentifier: `com.nativify.${appName.toLowerCase().replace(/[^a-z0-9]/g, '')}`
      },
      android: {
        adaptiveIcon: {
          foregroundImage: "./assets/adaptive-icon.png",
          backgroundColor: "#0F0F1A"
        },
        package: `com.nativify.${appName.toLowerCase().replace(/[^a-z0-9]/g, '')}`
      },
      web: {
        favicon: "./assets/favicon.png"
      }
    }
  }
}

// Generate package.json
function generatePackageJson(websiteUrl: string): object {
  let appName = "myapp"
  try {
    appName = new URL(websiteUrl).hostname.replace(/^www\./, '').split('.')[0]
  } catch {
    appName = "myapp"
  }
  return {
    name: appName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    version: "1.0.0",
    main: "node_modules/expo/AppEntry.js",
    scripts: {
      start: "expo start",
      android: "expo start --android",
      ios: "expo start --ios",
      web: "expo start --web",
      build: "eas build"
    },
    dependencies: {
      expo: "~50.0.0",
      "expo-status-bar": "~1.11.1",
      react: "18.2.0",
      "react-native": "0.73.2",
      "react-native-webview": "13.6.4"
    },
    devDependencies: {
      "@babel/core": "^7.20.0",
      "@types/react": "~18.2.45"
    },
    private: true
  }
}

// Generate eas.json for EAS Build
function generateEasJson(): object {
  return {
    cli: {
      version: ">= 7.0.0"
    },
    build: {
      development: {
        developmentClient: true,
        distribution: "internal"
      },
      preview: {
        distribution: "internal",
        android: {
          buildType: "apk"
        }
      },
      production: {}
    },
    submit: {
      production: {}
    }
  }
}

// Generate build script for one-command APK build
function generateBuildScript(): string {
  return `#!/bin/bash
# Nativify Build Script - One command APK builder
# Run this script: ./build-apk.sh

set -e

echo "================================================"
echo "  Nativify APK Builder"
echo "================================================"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install Node.js first."
    echo "Download from: https://nodejs.org/"
    exit 1
fi

# Check if eas-cli is installed
if ! command -v eas &> /dev/null; then
    echo "Installing EAS CLI..."
    npm install -g eas-cli
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Check if logged in to Expo
echo ""
echo "Checking Expo login status..."
if ! eas whoami &> /dev/null; then
    echo "Please log in to your Expo account:"
    eas login
fi

# Build APK
echo ""
echo "Starting APK build..."
echo "This will take approximately 10-15 minutes."
echo ""
eas build -p android --profile preview --non-interactive

echo ""
echo "================================================"
echo "  Build Complete!"
echo "================================================"
echo "Your APK download link will appear above."
echo "You can also find it at: https://expo.dev/builds"
`
}

// Generate Windows build script
function generateBuildScriptWindows(): string {
  return `@echo off
REM Nativify Build Script - One command APK builder (Windows)
REM Run this script: build-apk.bat

echo ================================================
echo   Nativify APK Builder
echo ================================================
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: npm is not installed. Please install Node.js first.
    echo Download from: https://nodejs.org/
    exit /b 1
)

REM Check if eas-cli is installed
where eas >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing EAS CLI...
    npm install -g eas-cli
)

REM Install dependencies
echo Installing dependencies...
npm install

REM Check if logged in to Expo
echo.
echo Checking Expo login status...
eas whoami >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Please log in to your Expo account:
    eas login
)

REM Build APK
echo.
echo Starting APK build...
echo This will take approximately 10-15 minutes.
echo.
eas build -p android --profile preview --non-interactive

echo.
echo ================================================
echo   Build Complete!
echo ================================================
echo Your APK download link will appear above.
echo You can also find it at: https://expo.dev/builds
pause
`
}

// Generate Snack code that uses iframe to show the website
function generateSnackPreviewCode(websiteUrl: string): string {
  return `import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export default function App() {
  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: '${websiteUrl}' }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  webview: {
    flex: 1,
  },
});`
}

export function MobileSimulator({ url }: MobileSimulatorProps) {
  const [view, setView] = useState<ViewMode>("phone")
  const [tab, setTab] = useState<TabType>("preview")
  const [copied, setCopied] = useState(false)
  const [buildDialogOpen, setBuildDialogOpen] = useState(false)
  const [buildState, setBuildState] = useState<BuildState>({
    status: "idle",
    message: ""
  })

  // Start automated build
  const handleAutomatedBuild = async () => {
    setBuildState({ status: "starting", message: "Preparing your app..." })
    
    try {
      const response = await fetch("/api/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Build failed")
      }
      
      // Snack-based build with instructions
      setBuildState({
        status: "finished",
        snackUrl: data.snackUrl,
        message: data.message || "Your app is ready!",
        instructions: data.instructions
      })
    } catch (error) {
      setBuildState({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to start build"
      })
    }
  }

  const resetBuild = () => {
    setBuildState({ status: "idle", message: "" })
  }

  // Generate all code dynamically based on the URL
  const appCode = useMemo(() => generateAppCode(url), [url])
  const appJson = useMemo(() => generateAppJson(url), [url])
  const packageJson = useMemo(() => generatePackageJson(url), [url])
  const easJson = useMemo(() => generateEasJson(), [])
  const snackCode = useMemo(() => generateSnackPreviewCode(url), [url])

  const getCodeForTab = (): string => {
    switch (tab) {
      case "app.js": return appCode
      case "app.json": return JSON.stringify(appJson, null, 2)
      case "package.json": return JSON.stringify(packageJson, null, 2)
      case "eas.json": return JSON.stringify(easJson, null, 2)
      default: return appCode
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getCodeForTab())
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const handleDownloadZip = async () => {
    const zip = new JSZip()
    const appNameFromJson = (appJson as { expo: { name: string } }).expo.name
    
    // Main source files
    zip.file("App.js", appCode)
    zip.file("app.json", JSON.stringify(appJson, null, 2))
    zip.file("package.json", JSON.stringify(packageJson, null, 2))
    zip.file("eas.json", JSON.stringify(easJson, null, 2))
    zip.file("babel.config.js", `module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};`)
    
    // Build scripts
    zip.file("build-apk.sh", generateBuildScript())
    zip.file("build-apk.bat", generateBuildScriptWindows())
    
    // Assets folder with placeholder images
    const assetsFolder = zip.folder("assets")
    // Create simple placeholder SVGs for icons
    const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="#4F46E5"/>
  <text x="512" y="512" font-family="Arial" font-size="400" fill="white" text-anchor="middle" dominant-baseline="middle">${appNameFromJson.charAt(0).toUpperCase()}</text>
</svg>`
    const splashSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1284" height="2778" viewBox="0 0 1284 2778">
  <rect width="1284" height="2778" fill="#0F0F1A"/>
  <text x="642" y="1389" font-family="Arial" font-size="120" fill="white" text-anchor="middle" dominant-baseline="middle">${appNameFromJson}</text>
</svg>`
    assetsFolder?.file("icon.png", iconSvg)
    assetsFolder?.file("splash.png", splashSvg)
    assetsFolder?.file("adaptive-icon.png", iconSvg)
    assetsFolder?.file("favicon.png", iconSvg)
    
    // README with instructions
    zip.file("README.md", `# ${appNameFromJson}

Generated by Nativify from ${url}

## Quick Start - Build APK

### Option 1: One-Command Build (Recommended)

**Mac/Linux:**
\`\`\`bash
chmod +x build-apk.sh
./build-apk.sh
\`\`\`

**Windows:**
\`\`\`
build-apk.bat
\`\`\`

### Option 2: Manual Build

1. Install dependencies:
   \`\`\`bash
   npm install -g eas-cli
   npm install
   \`\`\`

2. Login to Expo:
   \`\`\`bash
   eas login
   \`\`\`

3. Build APK:
   \`\`\`bash
   eas build -p android --profile preview
   \`\`\`

4. Download your APK from the link provided (takes ~10-15 minutes)

## Development

Start the development server:
\`\`\`bash
npx expo start
\`\`\`

## Support

For issues, visit: https://nativify.dev/support
`)

    // Generate and download ZIP
    const content = await zip.generateAsync({ type: "blob" })
    saveAs(content, `${appNameFromJson.toLowerCase()}-app.zip`)
  }

  const snackUrl = `https://snack.expo.dev/embedded?platform=web&name=Nativify%20Preview&theme=dark&preview=true&dependencies=react-native-webview&code=${encodeURIComponent(snackCode)}`

  return (
    <section className="w-full max-w-6xl mx-auto px-6 pb-20">
      {/* Section header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold text-foreground">Generated App Preview</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Live preview of your React Native app from{" "}
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              {url}
            </a>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-border text-muted-foreground hover:text-foreground"
            onClick={() => window.open(`https://snack.expo.dev/?code=${encodeURIComponent(snackCode)}&dependencies=react-native-webview`, '_blank')}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open in Expo Snack
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-border text-muted-foreground hover:text-foreground"
            onClick={handleDownloadZip}
          >
            <Download className="w-3.5 h-3.5" />
            Download Project
          </Button>
          <Dialog open={buildDialogOpen} onOpenChange={(open) => {
            setBuildDialogOpen(open)
            if (!open) resetBuild()
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 bg-primary text-primary-foreground hover:opacity-90">
                <Package className="w-3.5 h-3.5" />
                Build APK
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-background border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Build APK</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Generate an APK file for your app
                </DialogDescription>
              </DialogHeader>
              
              {buildState.status === "idle" ? (
                <div className="flex flex-col gap-4 mt-4">
                  {/* Automated Build Option */}
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
                    <div className="flex items-start gap-3">
                      <Package className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">Automated Build (Recommended)</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          We&apos;ll build your APK automatically using Expo EAS. Just click the button below.
                        </p>
                        <Button
                          onClick={handleAutomatedBuild}
                          className="mt-3 gap-2"
                          size="sm"
                        >
                          <Package className="w-4 h-4" />
                          Build APK Now
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs">or build manually</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Manual Build Steps */}
                  <div className="flex items-start gap-3 p-4 bg-surface rounded-lg border border-border">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-muted-foreground">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Download the project files</p>
                      <p className="text-sm text-muted-foreground mt-1">Click &quot;Download Project&quot; to get all the source files.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-surface rounded-lg border border-border">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-muted-foreground">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Install and build</p>
                      <pre className="mt-2 p-3 bg-background rounded-md text-xs font-mono text-foreground/80 overflow-x-auto">
                        <code>npm install -g eas-cli{'\n'}npm install{'\n'}eas login{'\n'}eas build -p android --profile preview</code>
                      </pre>
                    </div>
                  </div>
                </div>
              ) : buildState.status === "starting" || buildState.status === "queued" || buildState.status === "building" ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  <div className="text-center">
                    <p className="font-medium text-foreground">{buildState.message}</p>
                    {buildState.status === "queued" && (
                      <p className="text-sm text-muted-foreground mt-1">
                        EAS builds typically take 5-15 minutes
                      </p>
                    )}
                  </div>
                  <Progress 
                    value={
                      buildState.status === "starting" ? 10 :
                      buildState.status === "queued" ? 30 :
                      buildState.status === "building" ? 60 : 0
                    } 
                    className="w-full max-w-xs"
                  />
                  {buildState.expoUrl && (
                    <a
                      href={buildState.expoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View build progress on Expo
                    </a>
                  )}
                </div>
              ) : buildState.status === "finished" ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                  <div className="text-center">
                    <p className="font-medium text-foreground text-lg">{buildState.message}</p>
                  </div>
                  
                  {buildState.artifactUrl ? (
                    <Button asChild size="lg" className="gap-2 mt-2">
                      <a href={buildState.artifactUrl} download>
                        <Download className="w-5 h-5" />
                        Download APK
                      </a>
                    </Button>
                  ) : buildState.snackUrl ? (
                    <div className="flex flex-col gap-4 w-full max-w-md">
                      <Button asChild size="lg" className="gap-2">
                        <a href={buildState.snackUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-5 h-5" />
                          Open in Expo Snack
                        </a>
                      </Button>
                      {buildState.instructions && (
                        <div className="bg-surface rounded-lg border border-border p-4">
                          <p className="font-medium text-foreground text-sm mb-2">To get your APK:</p>
                          <ol className="text-sm text-muted-foreground list-decimal list-inside flex flex-col gap-1">
                            {buildState.instructions.map((instruction, i) => (
                              <li key={i}>{instruction.replace(/^\d+\.\s*/, '')}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {buildState.expoUrl && (
                    <a
                      href={buildState.expoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mt-2"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View on Expo
                    </a>
                  )}

                  <Button variant="outline" onClick={resetBuild} className="mt-4">
                    Build Another
                  </Button>
                </div>
              ) : buildState.status === "error" ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <XCircle className="w-12 h-12 text-destructive" />
                  <div className="text-center">
                    <p className="font-medium text-foreground">{buildState.message}</p>
                  </div>
                  {buildState.expoUrl && (
                    <a
                      href={buildState.expoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View details on Expo
                    </a>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleAutomatedBuild}>Try Again</Button>
                    <Button variant="outline" onClick={resetBuild}>Cancel</Button>
                  </div>
                </div>
              ) : null}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
        {/* Code / Preview panel */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center gap-0 border-b border-border px-2 pt-3 overflow-x-auto">
            {(["preview", "app.js", "app.json", "package.json", "eas.json"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors whitespace-nowrap flex items-center gap-1.5",
                  tab === t
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "preview" && <Smartphone className="w-3 h-3" />}
                {t === "app.js" && <FileCode className="w-3 h-3" />}
                {t === "app.json" && <Settings className="w-3 h-3" />}
                {t === "package.json" && <Package className="w-3 h-3" />}
                {t === "eas.json" && <Terminal className="w-3 h-3" />}
                {t === "preview" ? "Preview" : t}
              </button>
            ))}
            {tab !== "preview" && (
              <button
                onClick={handleCopy}
                className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors pb-2 px-3"
                aria-label="Copy to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            )}
          </div>

          {tab === "preview" ? (
            <div className="min-h-[500px] bg-muted/20 relative">
              <iframe
                src={snackUrl}
                className="w-full h-[500px] border-0"
                title="Expo Snack Preview"
                allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
                sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
              />
            </div>
          ) : (
            <pre className="p-4 text-xs font-mono text-foreground/80 overflow-x-auto leading-relaxed max-h-[500px] overflow-y-auto">
              <code>{getCodeForTab()}</code>
            </pre>
          )}
        </div>

        {/* Phone mockup with live website */}
        <div className="flex flex-col items-center gap-4">
          {/* View toggle */}
          <div className="flex items-center gap-1 bg-surface border border-border rounded-lg p-1">
            <button
              onClick={() => setView("phone")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                view === "phone" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Smartphone className="w-3.5 h-3.5" /> Phone
            </button>
            <button
              onClick={() => setView("tablet")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                view === "tablet" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Tablet className="w-3.5 h-3.5" /> Tablet
            </button>
          </div>

          {/* Device frame with actual website iframe */}
          <div
            className={cn(
              "relative bg-[#0A0A12] rounded-[2.5rem] border-[3px] border-[#2a2a3e] overflow-hidden shadow-2xl transition-all duration-300",
              view === "phone" ? "w-[260px] h-[520px]" : "w-[340px] h-[460px] rounded-[1.5rem]"
            )}
          >
            {/* Notch / status bar */}
            <div className="absolute top-0 inset-x-0 h-10 bg-[#0A0A12] flex items-center justify-between px-5 z-10">
              <span className="text-[10px] font-medium text-white/60">9:41</span>
              <div
                className={cn(
                  "bg-black rounded-full",
                  view === "phone" ? "w-20 h-6" : "hidden"
                )}
              />
              <div className="flex items-center gap-1">
                <div className="w-3 h-1.5 rounded-sm bg-white/60" />
              </div>
            </div>

            {/* Website iframe */}
            <div className="pt-10 h-full pb-6">
              <iframe
                src={url}
                className="w-full h-full border-0 bg-white"
                title="Website Preview"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            </div>

            {/* Home indicator */}
            <div className="absolute bottom-2 inset-x-0 flex justify-center">
              <div className="w-24 h-1 rounded-full bg-white/30" />
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center max-w-[260px]">
            Live preview of your website running in a native app wrapper
          </p>
        </div>
      </div>
    </section>
  )
}
