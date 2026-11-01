import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Feather } from '@expo/vector-icons';

const PRIMARY = '#2D7A31';
const PRIMARY_BG = '#EAF6E9';

export function GpsLocationButton({
  loading,
  onPress,
  compact = false,
  style,
}: {
  loading: boolean;
  onPress: () => void;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        compact ? styles.compactButton : styles.fullButton,
        style,
        pressed && !loading && styles.pressed,
        loading && styles.disabled,
      ]}
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel="Use my current GPS location"
      accessibilityState={{
        disabled: loading,
        busy: loading,
      }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={PRIMARY} />
      ) : (
        <Feather name="crosshair" size={14} color={PRIMARY} />
      )}
      <Text
        style={[
          styles.text,
          compact ? styles.compactText : styles.fullText,
        ]}
        numberOfLines={compact ? 2 : 1}
      >
        {loading
          ? 'Detecting your field…'
          : 'Use My Current GPS Location'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: `${PRIMARY}33`,
    backgroundColor: PRIMARY_BG,
  },
  compactButton: {
    minHeight: 44,
    maxWidth: 140,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexShrink: 0,
  },
  fullButton: {
    alignSelf: 'stretch',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.65,
  },
  icon: {
    fontSize: 14,
  },
  text: {
    color: PRIMARY,
    fontWeight: '800',
  },
  compactText: {
    flexShrink: 1,
    fontSize: 9,
    lineHeight: 13,
  },
  fullText: {
    fontSize: 11,
    lineHeight: 16,
  },
});
