import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';

import { PALETTE } from '@/components/UnifiedPageShell';

export type ActionButtonVariant =
  | 'primary'
  | 'secondary'
  | 'forest'
  | 'white'
  | 'outline'
  | 'heroPrimary'
  | 'heroGlass';

export interface ActionButtonProps {
  label: string;
  onPress: () => void | Promise<void>;
  icon?: keyof typeof Feather.glyphMap;
  rightIcon?: keyof typeof Feather.glyphMap;
  iconSize?: number;
  variant?: ActionButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

const VARIANT_STYLES = {
  primary: {
    backgroundColor: PALETTE.brandEmerald,
    borderColor: PALETTE.brandEmerald,
    textColor: '#FFFFFF',
    iconColor: '#FFFFFF',
  },
  secondary: {
    backgroundColor: PALETTE.sageTint,
    borderColor: '#DCE8DD',
    textColor: PALETTE.brandEmerald,
    iconColor: PALETTE.brandEmerald,
  },
  forest: {
    backgroundColor: PALETTE.brandDark,
    borderColor: PALETTE.brandDark,
    textColor: '#FFFFFF',
    iconColor: '#FFFFFF',
  },
  white: {
    backgroundColor: PALETTE.cardBg,
    borderColor: PALETTE.border,
    textColor: PALETTE.brandDark,
    iconColor: PALETTE.brandEmerald,
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: '#D1DBD1',
    textColor: PALETTE.brandDark,
    iconColor: PALETTE.brandEmerald,
  },
  heroPrimary: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
    textColor: '#0F291E',
    iconColor: '#0F291E',
  },
  heroGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.24)',
    textColor: '#FFFFFF',
    iconColor: '#FFFFFF',
  },
} as const;

export function ActionButton({
  label,
  onPress,
  icon,
  rightIcon,
  iconSize = 16,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  accessibilityLabel,
}: ActionButtonProps) {
  const [dispatching, setDispatching] = useState(false);
  const inFlight = useRef(false);
  const colors = VARIANT_STYLES[variant];
  const isBusy = loading || dispatching;
  const isDisabled = disabled || isBusy;

  const handlePress = useCallback(async () => {
    if (inFlight.current || isDisabled) return;

    inFlight.current = true;
    setDispatching(true);

    try {
      await onPress();
    } finally {
      inFlight.current = false;
      setDispatching(false);
    }
  }, [isDisabled, onPress]);

  return (
    <Pressable
      onPress={() => {
        void handlePress();
      }}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: isBusy }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
          opacity: isDisabled ? 0.65 : pressed ? 0.92 : 1,
          transform: [{ scale: pressed && !isDisabled ? 0.985 : 1 }],
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {isBusy ? (
        <ActivityIndicator size="small" color={colors.iconColor} />
      ) : icon ? (
        <Feather name={icon} size={iconSize} color={colors.iconColor} />
      ) : null}

      <Text
        style={[styles.label, { color: colors.textColor }, textStyle]}
        numberOfLines={2}
      >
        {label}
      </Text>

      {!isBusy && rightIcon ? (
        <Feather name={rightIcon} size={iconSize} color={colors.iconColor} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  label: {
    fontSize: 13.5,
    fontWeight: '700',
    textAlign: 'center',
    flexShrink: 1,
    fontVariant: ['tabular-nums'],
  },
});
