import React, { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

interface LiveTelemetryDotProps {
  color?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function LiveTelemetryDot({
  color = '#2D7A31',
  size = 8,
  style,
}: LiveTelemetryDotProps) {
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const useNativeDriver = Platform.OS !== 'web';
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.ease),
          useNativeDriver,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 0,
          useNativeDriver,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [pulse]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.8],
  });
  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0],
  });

  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.halo,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            opacity,
            transform: [{ scale }],
          },
        ]}
      />
      <View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
  },
  dot: {},
});
