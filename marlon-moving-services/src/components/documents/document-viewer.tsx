import { FileText } from 'lucide-react-native';
import { Image } from 'expo-image';
import { Modal, Pressable, Text, View } from 'react-native';

import { CustomerEmpty } from '@/components/customer/customer-shell';
import { HtmlViewer } from '@/components/documents/html-viewer';
import { brand } from '@/constants/operator-brand';

export function DocumentViewer({
  url,
  isPdf,
  isHtmlSnapshot,
  mimeType,
  onOpen,
}: {
  url: string | null;
  isPdf?: boolean | null;
  isHtmlSnapshot?: boolean | null;
  mimeType?: string | null;
  onOpen?: () => void;
}) {
  if (!url) {
    return <CustomerEmpty title="Preview unavailable" body="Refresh this screen to request a new secure document link." />;
  }

  const pdf = Boolean(isPdf || mimeType === 'application/pdf');
  if (pdf || isHtmlSnapshot) {
    return (
      <View style={styles.previewFrame}>
        <HtmlViewer uri={url} />
      </View>
    );
  }

  if (mimeType?.startsWith('image/')) {
    return <Image source={url} contentFit="contain" style={styles.imagePreview} />;
  }

  return (
    <Pressable onPress={onOpen} disabled={!onOpen} style={styles.secondaryButton}>
      <FileText color={brand.blue} size={17} />
      <Text style={styles.secondaryText}>Open document</Text>
    </Pressable>
  );
}

export function HtmlSnapshotModal({
  title,
  url,
  visible,
  onClose,
}: {
  title: string;
  url?: string | null;
  visible: boolean;
  onClose: () => void;
}) {
  if (!visible) return null;
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.snapshotOverlay}>
        <Pressable accessibilityLabel="Close HTML snapshot" onPress={onClose} style={{ position: 'absolute', inset: 0 }} />
        <View style={styles.snapshotSheet}>
          <Text selectable numberOfLines={1} style={{ color: brand.text, fontSize: 18, fontWeight: '900' }}>{title}</Text>
          {url ? (
            <View style={styles.previewFrame}>
              <HtmlViewer uri={url} />
            </View>
          ) : (
            <CustomerEmpty title="Snapshot unavailable" body="This document does not have an HTML snapshot link." />
          )}
          <Pressable onPress={onClose} style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = {
  previewFrame: { height: 520, minHeight: 320, borderRadius: 18, overflow: 'hidden' as const, borderWidth: 1, borderColor: brand.border, backgroundColor: '#FFFFFF' },
  imagePreview: { width: '100%' as const, height: 380, borderRadius: 18, backgroundColor: brand.blueSoft },
  secondaryButton: { minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: brand.blue, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8, backgroundColor: '#FFFFFF' },
  secondaryText: { color: brand.blue, fontSize: 13, fontWeight: '900' as const },
  snapshotOverlay: { flex: 1, justifyContent: 'flex-end' as const, backgroundColor: 'rgba(7,21,47,0.34)' },
  snapshotSheet: { width: '100%' as const, maxWidth: 720, maxHeight: '88%' as const, alignSelf: 'center' as const, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: brand.border, backgroundColor: brand.surface, padding: 14, gap: 10 },
};
