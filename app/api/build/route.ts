import { NextRequest, NextResponse } from "next/server"

interface BuildRequest {
  url: string
  appName?: string
}

// Generate the App.js code with WebView
function generateAppCode(websiteUrl: string): string {
  return `import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, SafeAreaView, StatusBar, Platform, BackHandler, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const webViewRef = useRef(null);

  useEffect(() => {
    if (Platform.OS === 'android') {
      const handleBack = () => {
        if (webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      };
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
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  webview: { flex: 1 },
  loader: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
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
  errorText: { color: '#F5F5F5', fontSize: 18, marginBottom: 16 },
  retryButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});`
}

export async function POST(request: NextRequest) {
  try {
    const body: BuildRequest = await request.json()
    const { url, appName } = body

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      )
    }

    // Validate URL
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json(
        { error: "Invalid URL" },
        { status: 400 }
      )
    }

    const hostname = parsedUrl.hostname.replace(/^www\./, "")
    const slugBase = appName || hostname.split(".")[0]
    const projectName = appName || slugBase.charAt(0).toUpperCase() + slugBase.slice(1)

    // Generate the app code
    const appCode = generateAppCode(url)

    // Create the Snack URL with embedded code
    // Expo Snack supports passing code via URL parameters
    const snackParams = new URLSearchParams({
      platform: "android",
      name: `${projectName} App`,
      theme: "dark",
      preview: "true",
      supportedPlatforms: "android,ios",
    })

    // For Snack, we need to encode the files in a specific format
    // The simplest approach is to create a URL that will open Snack with the code
    const snackFiles = {
      "App.js": {
        type: "CODE" as const,
        contents: appCode
      }
    }

    const snackDependencies = {
      "react-native-webview": "13.6.4"
    }

    // Create a data URL that Snack can understand
    const snackData = {
      name: `${projectName} App`,
      description: `Native app for ${url}`,
      files: snackFiles,
      dependencies: snackDependencies,
      sdkVersion: "51.0.0"
    }

    // Base64 encode the snack data for URL
    const encodedData = Buffer.from(JSON.stringify(snackData)).toString("base64url")

    // Create the Snack URL with code parameter
    // Note: Expo Snack supports `code` parameter for embedding code directly
    const snackUrl = `https://snack.expo.dev/?${snackParams.toString()}&code=${encodeURIComponent(appCode)}`

    // Also create a direct embed URL for preview
    const embedUrl = `https://snack.expo.dev/embedded/@snack/sdk.51.0.0?name=${encodeURIComponent(projectName)}&dependencies=${encodeURIComponent(JSON.stringify(snackDependencies))}&code=${encodeURIComponent(appCode)}&platform=android&theme=dark`

    return NextResponse.json({
      success: true,
      method: "snack",
      snackUrl: snackUrl,
      embedUrl: embedUrl,
      appCode: appCode,
      projectName: projectName,
      message: "Your app is ready! Follow these steps to build your APK:",
      instructions: [
        "Click 'Open in Expo Snack' below to open your app",
        "In Expo Snack, click the three-dot menu (...) in the top right corner",
        "Select 'Export to EAS Build'",
        "Choose 'Android' platform and 'APK' as build type",
        "Sign in with your Expo account if prompted",
        "Wait for the build to complete (5-15 minutes)",
        "Download your APK from the build page"
      ],
      quickBuild: {
        url: `https://snack.expo.dev/?platform=android&name=${encodeURIComponent(projectName + " App")}&dependencies=${encodeURIComponent(JSON.stringify(snackDependencies))}&sourceUrl=${encodeURIComponent(`data:text/javascript;base64,${Buffer.from(appCode).toString("base64")}`)}`,
        description: "Open this URL in your browser to access your app in Expo Snack"
      }
    })

  } catch (error) {
    console.error("Build error:", error)
    return NextResponse.json(
      { error: "Failed to start build", details: String(error) },
      { status: 500 }
    )
  }
}
