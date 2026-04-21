import React, { useEffect } from 'react';
import { Animated, StyleSheet, View, Text } from 'react-native';
import { theme } from '../theme';

export default function Toast({ message, type = 'success', duration = 3000, onHide }) {
  const slideAnim = React.useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    // Slide in
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto hide
    const timer = setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onHide?.();
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [slideAnim, duration, onHide]);

  const backgroundColor = 
    type === 'success' ? theme.colors.success :
    type === 'error' ? theme.colors.danger :
    type === 'warning' ? '#f59e0b' :
    '#3b82f6';

  return (
    <Animated.View
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-hidden={false}
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          backgroundColor,
          zIndex: 9999,
          pointerEvents: 'box-none',
        },
      ]}
    >
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.radius.md,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    boxShadow: '0 2px 3.84px rgba(0, 0, 0, 0.25)',
  },
  message: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    flex: 1,
  },
});
