import React, { useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';

import { ShopColors } from '@/constants/agri-shop-theme';

interface AcreageSliderProps {
  value: number;
  onChange: (nextValue: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function AcreageSlider({
  value,
  onChange,
  min = 1,
  max = 20,
  step = 1,
}: AcreageSliderProps) {
  const trackWidthRef = useRef(0);

  const updateFromX = (x: number) => {
    const width = trackWidthRef.current;
    if (width <= 0) return;

    const ratio = Math.max(0, Math.min(1, x / width));
    const rawValue = min + ratio * (max - min);
    const stepped = Math.round(rawValue / step) * step;
    const clamped = Math.max(min, Math.min(max, stepped));

    onChange(clamped);
  };

  const handlePress = (event: GestureResponderEvent) => {
    const x = event.nativeEvent.locationX;
    if (typeof x === 'number') updateFromX(x);
  };

  const handleAccessibilityAction = (actionName: string) => {
    if (actionName === 'increment') {
      onChange(Math.min(max, value + step));
      return;
    }

    if (actionName === 'decrement') {
      onChange(Math.max(min, value - step));
    }
  };

  const ratio = max > min ? (value - min) / (max - min) : 0;
  const percent = Math.max(0, Math.min(100, ratio * 100));
  const fillWidth = `${percent}%` as `${number}%`;
  const thumbLeft = `${percent}%` as `${number}%`;

  return (
    <View>
      <Pressable
        style={styles.track}
        onPress={handlePress}
        onLayout={(event) => {
          trackWidthRef.current = event.nativeEvent.layout.width;
        }}
        accessibilityRole="adjustable"
        accessibilityValue={{
          min,
          max,
          now: value,
          text: `${value} acres`,
        }}
        accessibilityActions={[
          { name: 'increment', label: 'Increase acreage' },
          { name: 'decrement', label: 'Decrease acreage' },
        ]}
        onAccessibilityAction={(event) =>
          handleAccessibilityAction(event.nativeEvent.actionName)
        }
      >
        <View style={styles.trackBackground} />
        <View style={[styles.trackFill, { width: fillWidth }]} />
        <View style={[styles.thumb, { left: thumbLeft }]} />
      </Pressable>

      <View style={styles.scaleRow}>
        <Text style={styles.scaleText}>{min} acre</Text>
        <Text style={styles.scaleHint}>Tap to set</Text>
        <Text style={styles.scaleText}>{max} acres</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 32,
    justifyContent: 'center',
    position: 'relative',
  },
  trackBackground: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DCE8D9',
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    height: 8,
    borderRadius: 4,
    backgroundColor: ShopColors.primary,
  },
  thumb: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ShopColors.white,
    borderWidth: 3,
    borderColor: ShopColors.primary,
    marginLeft: -11,
    marginTop: -11,
    top: '50%',
    elevation: 3,
    shadowColor: '#102A13',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  scaleText: {
    fontSize: 9,
    fontWeight: '700',
    color: ShopColors.soft,
  },
  scaleHint: {
    fontSize: 9,
    color: ShopColors.soft,
  },
});
