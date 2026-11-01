import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ShopColors } from '@/constants/agri-shop-theme';

interface QuantityStepperProps {
  value: number;
  onChange: (nextValue: number) => void;
  min?: number;
  max?: number;
  compact?: boolean;
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  compact = false,
}: QuantityStepperProps) {
  const canDecrease = value > min;
  const canIncrease = value < max;

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        disabled={!canDecrease}
        style={({ pressed }) => [
          styles.button,
          compact && styles.buttonCompact,
          !canDecrease && styles.buttonDisabled,
          pressed && canDecrease && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
      >
        <Text
          style={[
            styles.buttonText,
            compact && styles.buttonTextCompact,
            !canDecrease && styles.textDisabled,
          ]}
        >
          −
        </Text>
      </Pressable>

      <Text style={[styles.value, compact && styles.valueCompact]}>
        {value}
      </Text>

      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        disabled={!canIncrease}
        style={({ pressed }) => [
          styles.button,
          compact && styles.buttonCompact,
          !canIncrease && styles.buttonDisabled,
          pressed && canIncrease && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
      >
        <Text
          style={[
            styles.buttonText,
            compact && styles.buttonTextCompact,
            !canIncrease && styles.textDisabled,
          ]}
        >
          +
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ShopColors.mint,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ShopColors.chipBorder,
    padding: 3,
    gap: 2,
  },
  containerCompact: {
    borderRadius: 10,
    padding: 2,
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: ShopColors.white,
    borderWidth: 1,
    borderColor: ShopColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCompact: {
    width: 27,
    height: 27,
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: ShopColors.mint,
    borderColor: ShopColors.border,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: ShopColors.primaryDark,
    lineHeight: 20,
  },
  buttonTextCompact: {
    fontSize: 15,
    lineHeight: 17,
  },
  value: {
    minWidth: 34,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
    color: ShopColors.heading,
  },
  valueCompact: {
    minWidth: 26,
    fontSize: 13,
  },
  textDisabled: {
    color: ShopColors.disabled,
  },
  pressed: {
    opacity: 0.7,
  },
});
