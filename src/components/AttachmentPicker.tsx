// ============================================================================
// AttachmentPicker - Inline attachment list with add/remove
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { type PickedImage, showAttachmentOptions, formatFileSize } from '../utils/imagePicker';

interface Props {
  attachments: PickedImage[];
  onAdd: (image: PickedImage) => void;
  onRemove: (index: number) => void;
  maxAttachments?: number;
}

export function AttachmentPicker({ attachments, onAdd, onRemove, maxAttachments = 5 }: Props) {
  const { theme } = useTheme();
  const { colors } = theme;

  function handleAdd() {
    if (attachments.length >= maxAttachments) return;
    showAttachmentOptions(onAdd);
  }

  const isImage = (type: string) => type.startsWith('image/');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Attachments ({attachments.length}/{maxAttachments})
        </Text>
        {attachments.length < maxAttachments && (
          <TouchableOpacity onPress={handleAdd} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
            <Ionicons name="add" size={18} color={colors.textOnPrimary} />
            <Text style={[styles.addText, { color: colors.textOnPrimary }]}>Add</Text>
          </TouchableOpacity>
        )}
      </View>

      {attachments.map((att, idx) => (
        <View key={`${att.fileName}-${idx}`} style={[styles.item, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
          {isImage(att.type) ? (
            <Image source={{ uri: att.uri }} style={styles.thumbnail} />
          ) : (
            <View style={[styles.docIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="document" size={20} color={colors.primary} />
            </View>
          )}
          <View style={styles.itemInfo}>
            <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>{att.fileName}</Text>
            <Text style={[styles.fileSize, { color: colors.textSecondary }]}>{formatFileSize(att.fileSize)}</Text>
          </View>
          <TouchableOpacity
            onPress={() => onRemove(idx)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${att.fileName}`}
          >
            <Ionicons name="close-circle" size={22} color={colors.error} />
          </TouchableOpacity>
        </View>
      ))}

      {attachments.length === 0 && (
        <TouchableOpacity onPress={handleAdd} style={[styles.emptyZone, { borderColor: colors.border }]}>
          <Ionicons name="cloud-upload-outline" size={28} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Tap to add photos or documents</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 14, fontWeight: '500' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  addText: { fontSize: 13, fontWeight: '600' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: 10, borderWidth: 1 },
  thumbnail: { width: 40, height: 40, borderRadius: 6 },
  docIcon: { width: 40, height: 40, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1, gap: 2 },
  fileName: { fontSize: 13, fontWeight: '500' },
  fileSize: { fontSize: 11 },
  emptyZone: { alignItems: 'center', justifyContent: 'center', gap: 6, padding: 24, borderWidth: 1, borderStyle: 'dashed', borderRadius: 12 },
  emptyText: { fontSize: 13 },
});
