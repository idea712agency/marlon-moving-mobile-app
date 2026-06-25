import { View } from 'react-native';
import { WebView } from 'react-native-webview';

export function HtmlViewer({ html, uri }: { html?: string | null; uri?: string | null }) {
  return (
    <View style={{ flex: 1 }}>
      <WebView
        source={html ? { html } : { uri: uri ?? 'about:blank' }}
        javaScriptEnabled={false}
        originWhitelist={['*']}
        style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      />
    </View>
  );
}
