import React, { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withTiming
} from 'react-native-reanimated';

import { getThemeConfig } from '@/services/theme-utils';
import { BackgroundElement, TimerPhase, TimerTheme } from '@/types/timer';

// Get screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BackgroundElementsProps {
  theme: TimerTheme;
  phase: TimerPhase;
}

interface SnowflakeProps {
  delay: number;
  size: number;
  startX: number;
  duration: number;
}



interface PokeballProps {
  delay: number;
  size: number;
  x: number;
  y: number;
  rotation: number;
}

interface ChristmasOrnamentProps {
  delay: number;
  size: number;
  x: number;
  y: number;
  color: string;
}

interface ChristmasLightProps {
  delay: number;
  size: number;
  x: number;
  y: number;
  color: string;
}

interface SparkleProps {
  delay: number;
  size: number;
  x: number;
  y: number;
  duration: number;
}

// Snowflake component for Christmas theme
const Snowflake = React.memo<SnowflakeProps>(({ delay, size, startX, duration }) => {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Start animation after delay - fall from top to bottom of screen
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(SCREEN_HEIGHT + 100, {
          duration,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    );

    // Gentle horizontal drift - reduced complexity
    translateX.value = withDelay(
      delay,
      withRepeat(
        withTiming(20, {
          duration: duration * 0.8,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );

    // Simplified rotation
    rotation.value = withDelay(
      delay,
      withRepeat(
        withTiming(180, {
          duration: duration,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    );

    // Simplified opacity
    opacity.value = withDelay(
      delay,
      withTiming(0.6, {
        duration: 500,
        easing: Easing.out(Easing.quad),
      })
    );
  }, [delay, duration, translateY, translateX, rotation, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: startX + translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation.value}deg` },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={[styles.snowflake, { width: size, height: size }, animatedStyle]}>
      <View style={[styles.snowflakeCore, { backgroundColor: '#FFFFFF' }]} />
    </Animated.View>
  );
});
Snowflake.displayName = 'Snowflake';



// Pokeball component for Pokemon theme
const Pokeball = React.memo<PokeballProps>(({ delay, size, x, y, rotation }) => {
  const scale = useSharedValue(1);
  const rotate = useSharedValue(rotation);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    // Simplified scale animation
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(1.1, {
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );

    // Slower rotation for better performance
    rotate.value = withDelay(
      delay,
      withRepeat(
        withTiming(rotation + 180, {
          duration: 12000,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    );

    // Static opacity for better performance
    opacity.value = withDelay(
      delay,
      withTiming(0.5, {
        duration: 1000,
        easing: Easing.out(Easing.quad),
      })
    );
  }, [delay, rotation, scale, rotate, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: x },
        { translateY: y },
        { scale: scale.value },
        { rotate: `${rotate.value}deg` },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={[styles.pokeball, { width: size, height: size }, animatedStyle]}>
      <View style={[styles.pokeballTop, { height: size / 2 }]} />
      <View style={[styles.pokeballBottom, { height: size / 2 }]} />
      <View style={styles.pokeballCenter} />
      <View style={styles.pokeballButton} />
    </Animated.View>
  );
});
Pokeball.displayName = 'Pokeball';

// Sparkle component for Pokemon theme
const Sparkle = React.memo<SparkleProps>(({ delay, size, x, y, duration }) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Simplified scale animation
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, {
          duration: duration,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );

    // Simplified opacity animation
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0.7, {
          duration: duration * 0.6,
          easing: Easing.inOut(Easing.quad),
        }),
        -1,
        true
      )
    );

    // Slower rotation
    rotation.value = withDelay(
      delay,
      withRepeat(
        withTiming(90, {
          duration: duration * 1.5,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    );
  }, [delay, duration, scale, opacity, rotation]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: x },
        { translateY: y },
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={[styles.sparkle, { width: size, height: size }, animatedStyle]}>
      <View style={styles.sparkleCore} />
      <View style={[styles.sparkleCore, styles.sparkleRotated]} />
    </Animated.View>
  );
});
Sparkle.displayName = 'Sparkle';

// Christmas ornament component
const ChristmasOrnament = React.memo<ChristmasOrnamentProps>(({ delay, size, x, y, color }) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    // Simplified scale animation
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(1.05, {
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );

    // Gentle rotation
    rotation.value = withDelay(
      delay,
      withRepeat(
        withTiming(5, {
          duration: 6000,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );

    // Static opacity for better performance
    opacity.value = withDelay(
      delay,
      withTiming(0.7, {
        duration: 1000,
        easing: Easing.out(Easing.quad),
      })
    );
  }, [delay, scale, rotation, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: x },
        { translateY: y },
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={[styles.ornament, { width: size, height: size }, animatedStyle]}>
      <View style={[styles.ornamentBall, { backgroundColor: color }]} />
      <View style={styles.ornamentCap} />
    </Animated.View>
  );
});
ChristmasOrnament.displayName = 'ChristmasOrnament';

// Christmas light component
const ChristmasLight = React.memo<ChristmasLightProps>(({ delay, size, x, y, color }) => {
  const opacity = useSharedValue(0.6);
  const scale = useSharedValue(1);

  useEffect(() => {
    // Simplified blinking effect
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0.4, {
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
        }),
        -1,
        true
      )
    );

    // Subtle scale animation
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(1.1, {
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );
  }, [delay, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: x },
        { translateY: y },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={[styles.light, { width: size, height: size }, animatedStyle]}>
      <View style={[styles.lightBulb, { backgroundColor: color }]} />
      <View style={styles.lightGlow} />
    </Animated.View>
  );
});
ChristmasLight.displayName = 'ChristmasLight';

// Main background elements component
export const BackgroundElements: React.FC<BackgroundElementsProps> = React.memo(({ theme, phase }) => {
  const [backgroundElements, setBackgroundElements] = React.useState<BackgroundElement[]>([]);

  // Memoize all configurations at the top to avoid conditional hooks
  const snowflakeConfigs = useMemo(() => 
    Array.from({ length: 8 }, (_, i) => ({
      key: `snowflake-${i}`,
      delay: i * 800,
      size: 8 + (i % 3) * 2,
      startX: (i * SCREEN_WIDTH / 8) + Math.random() * 50,
      duration: 8000 + (i % 2) * 2000,
    })), []);

  // Memoize Christmas element configurations
  const christmasConfigs = useMemo(() => {
    const ornamentColors = ['#DC143C', '#FFD700', '#228B22', '#FF6347'];
    const lightColors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'];
    
    return {
      ornaments: Array.from({ length: 5 }, (_, i) => ({
        key: `ornament-${i}`,
        delay: i * 1000,
        size: 20 + (i % 2) * 8,
        x: (i * SCREEN_WIDTH / 5) + Math.random() * 60,
        y: 100 + (i % 3) * 150,
        color: ornamentColors[i % ornamentColors.length],
      })),
      lights: Array.from({ length: 8 }, (_, i) => ({
        key: `light-${i}`,
        delay: i * 500,
        size: 8 + (i % 2) * 2,
        x: (i * SCREEN_WIDTH / 8) + Math.random() * 40,
        y: 50 + (i % 4) * 100,
        color: lightColors[i % lightColors.length],
      })),
    };
  }, []);

  // Memoize Pokemon element configurations
  const pokemonConfigs = useMemo(() => ({
    pokeballs: Array.from({ length: 4 }, (_, i) => ({
      key: `pokeball-${i}`,
      delay: i * 1500,
      size: 30 + (i % 2) * 10,
      x: (i * SCREEN_WIDTH / 4) + Math.random() * 80,
      y: 120 + (i % 3) * 180,
      rotation: i * 90,
    })),
    sparkles: Array.from({ length: 8 }, (_, i) => ({
      key: `sparkle-${i}`,
      delay: i * 600,
      size: 6 + (i % 2) * 2,
      x: (i * SCREEN_WIDTH / 8) + Math.random() * 50,
      y: 80 + (i % 4) * 120,
      duration: 3000 + (i % 2) * 1000,
    })),
  }), []);

  // Load background elements for the current theme
  React.useEffect(() => {
    const loadBackgroundElements = async () => {
      try {
        const themeConfig = await getThemeConfig(theme);
        if (themeConfig?.backgroundElements) {
          setBackgroundElements(themeConfig.backgroundElements);
        } else {
          setBackgroundElements([]);
        }
      } catch (error) {
        console.warn('Failed to load background elements:', error);
        setBackgroundElements([]);
      }
    };

    loadBackgroundElements();
  }, [theme]);

  // Handle predefined themes with hardcoded logic for backward compatibility
  if (theme === TimerTheme.SNOW) {
    return (
      <View style={styles.container}>
        {/* Snowflakes */}
        {snowflakeConfigs.map((config) => (
          <Snowflake
            key={config.key}
            delay={config.delay}
            size={config.size}
            startX={config.startX}
            duration={config.duration}
          />
        ))}
      </View>
    );
  }

  if (theme === TimerTheme.CHRISTMAS) {
    return (
      <View style={styles.container}>
        {/* Christmas ornaments */}
        {christmasConfigs.ornaments.map((config) => (
          <ChristmasOrnament
            key={config.key}
            delay={config.delay}
            size={config.size}
            x={config.x}
            y={config.y}
            color={config.color}
          />
        ))}
        
        {/* Christmas lights */}
        {christmasConfigs.lights.map((config) => (
          <ChristmasLight
            key={config.key}
            delay={config.delay}
            size={config.size}
            x={config.x}
            y={config.y}
            color={config.color}
          />
        ))}
      </View>
    );
  }

  if (theme === TimerTheme.POKEMON) {
    return (
      <View style={styles.container}>
        {/* Pokeballs */}
        {pokemonConfigs.pokeballs.map((config) => (
          <Pokeball
            key={config.key}
            delay={config.delay}
            size={config.size}
            x={config.x}
            y={config.y}
            rotation={config.rotation}
          />
        ))}
        
        {/* Sparkles */}
        {pokemonConfigs.sparkles.map((config) => (
          <Sparkle
            key={config.key}
            delay={config.delay}
            size={config.size}
            x={config.x}
            y={config.y}
            duration={config.duration}
          />
        ))}
      </View>
    );
  }

  // Handle generated themes with dynamic background elements
  if (backgroundElements.length > 0) {
    return (
      <View style={styles.container}>
        {backgroundElements.map((element, index) => {
          if (element.type === 'particles') {
            const config = element.config;
            const count = config.count || 10;
            
            if (config.pattern === 'snowflakes') {
              return Array.from({ length: count }, (_, i) => (
                <Snowflake
                  key={`generated-snowflake-${index}-${i}`}
                  delay={i * 500}
                  size={8 + Math.random() * 6}
                  startX={Math.random() * SCREEN_WIDTH}
                  duration={config.animationDuration || 6000}
                />
              ));
            } else {
              // Generic sparkles for other particle patterns
              return Array.from({ length: count }, (_, i) => (
                <Sparkle
                  key={`generated-sparkle-${index}-${i}`}
                  delay={i * 400}
                  size={6 + Math.random() * 4}
                  x={Math.random() * (SCREEN_WIDTH - 20)}
                  y={Math.random() * (SCREEN_HEIGHT - 100)}
                  duration={config.animationDuration || 3000}
                />
              ));
            }
          }
          return null;
        })}
      </View>
    );
  }

  // Default theme or no background elements
  return null;
});

BackgroundElements.displayName = 'BackgroundElements';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  
  // Snowflake styles
  snowflake: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  snowflakeCore: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    // Removed shadow for better performance
  },

  
  // Pokeball styles
  pokeball: {
    position: 'absolute',
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#000000',
  },
  pokeballTop: {
    backgroundColor: '#FF6B6B',
    width: '100%',
  },
  pokeballBottom: {
    backgroundColor: '#FFFFFF',
    width: '100%',
  },
  pokeballCenter: {
    position: 'absolute',
    top: '45%',
    left: '35%',
    width: '30%',
    height: '10%',
    backgroundColor: '#000000',
  },
  pokeballButton: {
    position: 'absolute',
    top: '42%',
    left: '42%',
    width: '16%',
    height: '16%',
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#000000',
  },
  
  // Sparkle styles
  sparkle: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleCore: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: '#FFD700',
    borderRadius: 1,
    // Removed shadow for better performance
  },
  sparkleRotated: {
    transform: [{ rotate: '90deg' }],
  },
  
  // Christmas ornament styles
  ornament: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ornamentBall: {
    width: '85%',
    height: '85%',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#FFD700',
    // Removed shadow for better performance
  },
  ornamentCap: {
    position: 'absolute',
    top: -2,
    width: '40%',
    height: '20%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#DAA520',
  },
  
  // Christmas light styles
  light: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightBulb: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    // Removed shadow for better performance
  },
  lightGlow: {
    position: 'absolute',
    width: '150%',
    height: '150%',
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});