// ============================================================================
// Image Picker - Camera and gallery for document/photo uploads
// ============================================================================

import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

export interface PickedImage {
  uri: string;
  width: number;
  height: number;
  type: string;
  fileName: string;
  fileSize?: number;
  base64?: string;
}

/**
 * Request camera permissions and take a photo.
 */
export async function takePhoto(includeBase64 = true): Promise<PickedImage | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission Required', 'Camera access is needed to take photos.');
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: 'images',
    quality: 0.8,
    base64: includeBase64,
    allowsEditing: false,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    type: asset.mimeType || 'image/jpeg',
    fileName: asset.fileName || `photo_${Date.now()}.jpg`,
    fileSize: asset.fileSize,
    base64: asset.base64 || undefined,
  };
}

/**
 * Pick an image from the device gallery.
 */
export async function pickImage(includeBase64 = true): Promise<PickedImage | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission Required', 'Photo library access is needed to select images.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    quality: 0.8,
    base64: includeBase64,
    allowsEditing: false,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    type: asset.mimeType || 'image/jpeg',
    fileName: asset.fileName || `image_${Date.now()}.jpg`,
    fileSize: asset.fileSize,
    base64: asset.base64 || undefined,
  };
}

/**
 * Pick a document (PDF, etc.) from the device.
 * Uses expo-document-picker if available, falls back to image picker.
 */
export async function pickDocument(): Promise<PickedImage | null> {
  try {
    // Try expo-document-picker dynamically
    const DocumentPicker = require('expo-document-picker');
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]) return null;

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      width: 0,
      height: 0,
      type: asset.mimeType || 'application/octet-stream',
      fileName: asset.name || `document_${Date.now()}`,
      fileSize: asset.size,
    };
  } catch {
    // expo-document-picker not installed, fall back to image picker
    return pickImage();
  }
}

/**
 * Show an action sheet to choose between camera, gallery, or document.
 */
export function showAttachmentOptions(
  onResult: (image: PickedImage) => void
): void {
  Alert.alert('Add Attachment', 'Choose a source', [
    {
      text: 'Take Photo',
      onPress: async () => {
        const img = await takePhoto();
        if (img) onResult(img);
      },
    },
    {
      text: 'Choose from Gallery',
      onPress: async () => {
        const img = await pickImage();
        if (img) onResult(img);
      },
    },
    {
      text: 'Choose Document',
      onPress: async () => {
        const doc = await pickDocument();
        if (doc) onResult(doc);
      },
    },
    { text: 'Cancel', style: 'cancel' },
  ]);
}

/**
 * Format file size for display.
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
