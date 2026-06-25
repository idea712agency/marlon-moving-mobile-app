import React from 'react';
import { View } from 'react-native';

export function HtmlViewer({ html, uri }: { html?: string | null; uri?: string | null }) {
  return (
    <View style={{ flex: 1 }}>
      {React.createElement('iframe', {
        src: html ? undefined : uri ?? 'about:blank',
        srcDoc: html ?? undefined,
        sandbox: '',
        style: {
          width: '100%',
          height: '100%',
          border: 0,
          backgroundColor: '#FFFFFF',
        },
        title: 'Document preview',
      })}
    </View>
  );
}
