import { useFonts } from 'expo-font';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { FoundationScreen } from './src/components/foundation/FoundationScreen';
import { StartupGate } from './src/components/foundation/StartupGate';
import { getAppConfig } from './src/config/appConfig';
import { DesignSystemPreviewScreen } from './src/design-system';
import { AppErrorBoundary } from './src/error/AppErrorBoundary';
import { createLogger } from './src/logging/logger';
import { plusJakartaFontMap, semanticColors } from './src/theme';

const config = getAppConfig();
const logger = createLogger({ environment: config.appEnv });

export default function App() {
  const [boundaryKey, setBoundaryKey] = useState(0);
  const [showDesignPreview, setShowDesignPreview] = useState(false);
  const [fontsLoaded, fontError] = useFonts(plusJakartaFontMap);

  // Proceed with system fallback if fonts fail — do not block the app.
  const fontsReady = fontsLoaded || fontError != null;

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <AppErrorBoundary
          key={boundaryKey}
          logger={logger}
          diagnosticsEnabled={config.diagnosticsEnabled}
          onRetry={() => setBoundaryKey((value) => value + 1)}
        >
          <StartupGate logger={logger} ready={fontsReady}>
            {config.diagnosticsEnabled && showDesignPreview ? (
              <DesignSystemPreviewScreen
                onClose={() => setShowDesignPreview(false)}
              />
            ) : (
              <FoundationScreen
                config={config}
                assetStatus="loaded"
                loggerStatus="ready"
                errorBoundaryStatus="active"
                onOpenDesignPreview={
                  config.diagnosticsEnabled
                    ? () => setShowDesignPreview(true)
                    : undefined
                }
              />
            )}
          </StartupGate>
        </AppErrorBoundary>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: semanticColors.background.primary,
  },
});
