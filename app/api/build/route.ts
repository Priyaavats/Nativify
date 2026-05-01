import { NextRequest, NextResponse } from "next/server"

interface BuildRequest {
  url: string
  appName?: string
}

// Generate the App.js code with WebView, header bar, and pull-to-refresh
function generateAppCode(websiteUrl: string, appName: string): string {
  return `import React, { useState, useRef, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  ActivityIndicator, 
  SafeAreaView, 
  StatusBar, 
  Platform, 
  BackHandler, 
  Text, 
  TouchableOpacity,
  RefreshControl,
  ScrollView
} from 'react-native';
import { WebView } from 'react-native-webview';

const APP_NAME = '${appName}';
const WEBSITE_URL = '${websiteUrl}';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(WEBSITE_URL);
  const [refreshing, setRefreshing] = useState(false);
  const webViewRef = useRef(null);

  // Handle Android back button
  React.useEffect(() => {
    if (Platform.OS === 'android') {
      const handleBack = () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      };
      BackHandler.addEventListener('hardwareBackPress', handleBack);
      return () => BackHandler.removeEventListener('hardwareBackPress', handleBack);
    }
  }, [canGoBack]);

  // Pull to refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  }, []);

  // Navigation state update
  const handleNavigationStateChange = (navState) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setCurrentUrl(navState.url);
  };

  // Header component with navigation controls
  const Header = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <TouchableOpacity 
          style={[styles.navButton, !canGoBack && styles.navButtonDisabled]}
          onPress={() => canGoBack && webViewRef.current?.goBack()}
          disabled={!canGoBack}
        >
          <Text style={[styles.navButtonText, !canGoBack && styles.navButtonTextDisabled]}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.navButton, !canGoForward && styles.navButtonDisabled]}
          onPress={() => canGoForward && webViewRef.current?.goForward()}
          disabled={!canGoForward}
        >
          <Text style={[styles.navButtonText, !canGoForward && styles.navButtonTextDisabled]}>→</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.headerTitle} numberOfLines={1}>{APP_NAME}</Text>
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={() => webViewRef.current?.reload()}
      >
        <Text style={styles.refreshButtonText}>↻</Text>
      </TouchableOpacity>
    </View>
  );

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
        <Header />
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorText}>Unable to load the page</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => { setError(false); setLoading(true); }}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <Header />
      <View style={styles.webviewContainer}>
        {loading && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}
        <ScrollView
          contentContainerStyle={{ flex: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6366f1"
              colors={['#6366f1']}
            />
          }
        >
          <WebView
            ref={webViewRef}
            source={{ uri: WEBSITE_URL }}
            style={styles.webview}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => { setLoading(false); setRefreshing(false); }}
            onError={() => { setError(true); setRefreshing(false); }}
            onNavigationStateChange={handleNavigationStateChange}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            scalesPageToFit={true}
            allowsBackForwardNavigationGestures={true}
            pullToRefreshEnabled={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d44',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    flex: 1,
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#2d2d44',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: '#252538',
  },
  navButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  navButtonTextDisabled: {
    color: '#4a4a5a',
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: '#0f0f1a',
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
    backgroundColor: '#0f0f1a',
    zIndex: 10,
  },
  loadingText: {
    color: '#9ca3af',
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f1a',
    padding: 24,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorText: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
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
    const appCode = generateAppCode(url, projectName)

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
