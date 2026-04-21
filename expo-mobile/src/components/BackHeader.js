import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';

export default function BackHeader({ title, onBackPress, rightElement }) {
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.header}>
      <Pressable style={styles.backButton} onPress={handleBack}>
        <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
        <Text style={styles.backText}>Quay lại</Text>
      </Pressable>
      
      {title && <Text style={styles.title}>{title}</Text>}
      
      {rightElement ? rightElement : <View style={styles.spacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: theme.radius.md,
    gap: 4,
  },
  backText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  title: {
    flex: 1,
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  spacer: {
    width: 70,
  },
});
