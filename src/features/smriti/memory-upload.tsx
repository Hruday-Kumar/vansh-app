/**
 * 🪷 MEMORY UPLOAD - Add new memories to the family collection
 */

import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeritageCard, MemberAvatar, SacredText, SilkButton } from '../../components';
import { useAuthStore, useFamilyStore, useMemoryStore } from '../../state';
import { VanshColors, VanshInsets, VanshRadius, VanshSpacing } from '../../theme';
import type { MemberId } from '../../types';

interface MemoryUploadProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function MemoryUpload({ onComplete, onCancel }: MemoryUploadProps) {
  const insets = useSafeAreaInsets();
  const { membersList } = useFamilyStore();
  const { addMemory, addToUploadQueue, updateUploadProgress, removeFromUploadQueue } = useMemoryStore();
  const { user } = useAuthStore();
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taggedMembers, setTaggedMembers] = useState<MemberId[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const pickImage = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      exif: true,
    });
    
    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  }, []);
  
  const takePhoto = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please allow camera access.');
      return;
    }
    
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
      exif: true,
    });
    
    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  }, []);
  
  const toggleMemberTag = useCallback((memberId: MemberId) => {
    setTaggedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  }, []);
  
  const handleUpload = useCallback(async () => {
    if (!selectedImage) {
      Alert.alert('Select Image', 'Please select or take a photo first.');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Get auth token
      const token = useAuthStore.getState().token;
      const { API_URL } = await import('../../config/api');
      
      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', {
        uri: selectedImage,
        type: 'image/jpeg',
        name: 'memory.jpg',
      } as any);
      
      // Title is required - use user input or generate from timestamp
      formData.append('title', title.trim() || `Memory ${new Date().toLocaleDateString()}`);
      if (description) formData.append('description', description);
      if (taggedMembers.length > 0) {
        formData.append('taggedMembers', JSON.stringify(taggedMembers));
      }
      
      console.log('📤 Uploading memory to:', `${API_URL}/memories`);
      
      const response = await fetch(`${API_URL}/memories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      
      const data = await response.json();
      console.log('📥 Upload response:', data);
      
      if (data.success) {
        // Add to local store with correct SmritiMedia properties
        addMemory({
          id: data.data.id,
          type: 'photo',
          uri: data.data.uri,
          uploadedAt: Date.now(),
          uploadedBy: user?.memberId as any,
          title: title || undefined,
          description: description || undefined,
          tags: [],
          linkedMembers: taggedMembers,
          linkedKathas: [],
        });
        
        Alert.alert('Success', 'Memory added to your family collection! 🪷', [
          { text: 'Add Another', onPress: () => {
            setSelectedImage(null);
            setTitle('');
            setDescription('');
            setTaggedMembers([]);
          }},
          { text: 'Done', onPress: onComplete },
        ]);
      } else {
        throw new Error(data.error?.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', error.message || 'Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [selectedImage, title, description, taggedMembers, user, addMemory, onComplete]);
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <SilkButton variant="ghost" label="Cancel" onPress={onCancel} />
        <SacredText variant="title" color="primary">Add Memory</SacredText>
        <View style={{ width: 70 }} />
      </View>
      
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Selection */}
        <HeritageCard variant="outlined" style={styles.imageCard}>
          {selectedImage ? (
            <View style={styles.previewContainer}>
              <Image
                source={{ uri: selectedImage }}
                style={styles.preview}
                contentFit="cover"
              />
              <SilkButton
                variant="secondary"
                size="sm"
                label="Change"
                onPress={pickImage}
                style={styles.changeButton}
              />
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <SacredText variant="hero" color="muted" align="center">📷</SacredText>
              <SacredText variant="body" color="muted" align="center" style={styles.placeholderText}>
                Select a photo to preserve
              </SacredText>
              <View style={styles.imageButtons}>
                <SilkButton
                  variant="secondary"
                  label="📁 Choose Photo"
                  onPress={pickImage}
                  style={styles.imageButton}
                />
                <SilkButton
                  variant="secondary"
                  label="📸 Take Photo"
                  onPress={takePhoto}
                  style={styles.imageButton}
                />
              </View>
            </View>
          )}
        </HeritageCard>
        
        {/* Title */}
        <View style={styles.field}>
          <SacredText variant="label" color="muted" style={styles.label}>
            Title (Optional)
          </SacredText>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Give this memory a name..."
            placeholderTextColor={VanshColors.masi[400]}
          />
        </View>
        
        {/* Description */}
        <View style={styles.field}>
          <SacredText variant="label" color="muted" style={styles.label}>
            Story Behind This Memory
          </SacredText>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="What's the story behind this photo? Who took it? What was happening?"
            placeholderTextColor={VanshColors.masi[400]}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
        
        {/* Tag Members */}
        <View style={styles.field}>
          <SacredText variant="label" color="muted" style={styles.label}>
            Who's in This Photo?
          </SacredText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.memberList}>
              {membersList.slice(0, 10).map(member => {
                const isSelected = taggedMembers.includes(member.id);
                return (
                  <View
                    key={member.id}
                    style={[styles.memberItem, isSelected && styles.memberSelected]}
                  >
                    <MemberAvatar
                      uri={member.avatarUri}
                      name={`${member.firstName} ${member.lastName}`}
                      size="md"
                      isAlive={member.isAlive}
                      showName
                      style={{ opacity: isSelected ? 1 : 0.6 }}
                    />
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </ScrollView>
      
      {/* Upload Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + VanshSpacing.md }]}>
        <SilkButton
          variant="primary"
          size="lg"
          label={isUploading ? 'Preserving Memory...' : '🪷 Add to Family Collection'}
          onPress={handleUpload}
          isLoading={isUploading}
          isDisabled={!selectedImage}
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: VanshColors.khadi[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: VanshSpacing.md,
    paddingVertical: VanshSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: VanshColors.khadi[200],
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: VanshSpacing.lg,
  },
  imageCard: {
    marginBottom: VanshSpacing.lg,
  },
  previewContainer: {
    position: 'relative',
  },
  preview: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: VanshRadius.md,
  },
  changeButton: {
    position: 'absolute',
    bottom: VanshSpacing.sm,
    right: VanshSpacing.sm,
  },
  placeholderContainer: {
    padding: VanshSpacing.xl,
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: VanshSpacing.sm,
    marginBottom: VanshSpacing.lg,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: VanshSpacing.md,
  },
  imageButton: {
    flex: 1,
  },
  field: {
    marginBottom: VanshSpacing.lg,
  },
  label: {
    marginBottom: VanshSpacing.xs,
  },
  input: {
    backgroundColor: VanshColors.khadi[100],
    borderRadius: VanshRadius.md,
    paddingHorizontal: VanshInsets.input.horizontal,
    paddingVertical: VanshInsets.input.vertical,
    fontSize: 16,
    color: VanshColors.masi[900],
    fontFamily: 'Georgia',
  },
  textArea: {
    minHeight: 100,
    paddingTop: VanshSpacing.sm,
  },
  memberList: {
    flexDirection: 'row',
    gap: VanshSpacing.md,
    paddingVertical: VanshSpacing.sm,
  },
  memberItem: {
    padding: VanshSpacing.xs,
    borderRadius: VanshRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  memberSelected: {
    borderColor: VanshColors.suvarna[500],
    backgroundColor: VanshColors.suvarna[50],
  },
  footer: {
    padding: VanshSpacing.lg,
    borderTopWidth: 1,
    borderTopColor: VanshColors.khadi[200],
  },
});
