import { useLocalSearchParams } from 'expo-router';

import { TemplateEditorScreen } from '@/components/operator/templates/template-editor-screen';

export default function EditTemplateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const templateId = Array.isArray(id) ? id[0] : id;
  return <TemplateEditorScreen templateId={templateId} />;
}
