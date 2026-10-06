
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BRAND = '#0D9488';
const INK = '#042F2E';

const TIPS = [
  {
    icon: 'shield-checkmark',
    color: '#0D9488',
    soft: '#E6FAF6',
    title: 'Shop safely with escrow',
    text: 'We hold your payment until your order arrives. The seller is only paid after you confirm delivery.',
  },
  {
    icon: 'film',
    color: '#7C3AED',
    soft: '#F3EFFF',
    title: 'Discover products in Feeds',
    text: 'Swipe through short, interactive videos from sellers. See products in action and buy right from the video.',
  },
  {
    icon: 'chatbubbles',
    color: '#2563EB',
    soft: '#EAF1FF',
    preview: 'chat',
    title: 'Chat with vendors, negotiate prices',
    text: 'Message sellers directly, ask questions and agree on a price before you pay.',
  },
  {
    icon: 'storefront',
    color: '#D97706',
    soft: '#FFF4DB',
    title: 'A wide range to choose from',
    text: 'Browse many vendors and thousands of products in one place, from everyday items to unique finds.',
  },
  {
    icon: 'flash',
    color: '#E11D48',
    soft: '#FFE9ED',
    title: 'Get your order fast',
    text: 'Choose instant delivery on eligible items and have your purchase on its way within minutes.',
  },
];

/* ---------- storage (safe even if AsyncStorage isn't in your binary) ---------- */

let shownThisSession = false; // fallback so it never nags within one app session

function getAsyncStorage() {
  try {
    const mod = require('@react-native-async-storage/async-storage');
    return mod.default ?? mod;
  } catch {
    return null;
  }
}

async function hasSeen(storage, key) {
  if (shownThisSession) return true;
  try {
    return (await storage?.getItem(key)) === '1';
  } catch {
    return false;
  }
}

async function markSeen(storage, key) {
  shownThisSession = true;
  try {
    await storage?.setItem(key, '1');
  } catch {}
}

/* ---------- UI ---------- */

function ChatPreview({ color }) {
  return (
    <View style={styles.chat}>
      <View style={[styles.bubble, styles.bubbleThem]}>
        <Text style={styles.bubbleThemText}>Would you take 150 for it?</Text>
      </View>
      <View style={[styles.bubble, styles.bubbleYou, { backgroundColor: color }]}>
        <Text style={styles.bubbleYouText}>Sure, deal!</Text>
      </View>
      <View style={styles.chatChip}>
        <Ionicons name="checkmark-circle" size={15} color={BRAND} />
        <Text style={styles.chatChipText}>Price agreed</Text>
      </View>
    </View>
  );
}

function Slide({ tip, width }) {
  return (
    <View style={{ width, paddingHorizontal: 24 }}>
      <View style={[styles.hero, { backgroundColor: tip.soft }]}>
        {tip.preview === 'chat' ? (
          <ChatPreview color={tip.color} />
        ) : (
          <>
            <View style={[styles.ring, styles.ringOuter, { borderColor: tip.color }]} />
            <View style={[styles.ring, styles.ringInner, { borderColor: tip.color }]} />
            <View style={[styles.tile, { backgroundColor: tip.color }]}>
              <Ionicons name={tip.icon} size={38} color="#fff" />
            </View>
          </>
        )}
      </View>
      <Text style={styles.title}>{tip.title}</Text>
      <Text style={styles.text}>{tip.text}</Text>
    </View>
  );
}

/**
 * Props
 *  - delay: ms before showing (default 1200)
 *  - storageKey: key used to remember it was seen
 *  - storage: optional { getItem, setItem } — pass your own if you already use
 *             another persistence layer (MMKV wrapper, etc.)
 */
export default function WelcomeTipsSheet({
  delay = 1200,
  storageKey = 'welcome-tips-seen',
  storage,
}) {
  const { width } = useWindowDimensions();
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const listRef = useRef(null);
  const anim = useRef(new Animated.Value(0)).current;
  const store = useRef(storage ?? getAsyncStorage()).current;

  useEffect(() => {
    let timer;
    let cancelled = false;
    (async () => {
      if (await hasSeen(store, storageKey)) return;
      try {
        setReduceMotion(await AccessibilityInfo.isReduceMotionEnabled());
      } catch {}
      timer = setTimeout(() => !cancelled && setVisible(true), delay);
    })();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [delay, storageKey, store]);

  useEffect(() => {
    if (!visible) return;
    Animated.timing(anim, {
      toValue: 1,
      duration: reduceMotion ? 0 : 380,
      useNativeDriver: true,
    }).start();
  }, [visible, anim, reduceMotion]);

  const close = useCallback(() => {
    markSeen(store, storageKey);
    Animated.timing(anim, {
      toValue: 0,
      duration: reduceMotion ? 0 : 200,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  }, [anim, store, storageKey, reduceMotion]);

  const goTo = (i) => {
    listRef.current?.scrollToIndex({ index: i, animated: !reduceMotion });
    setIndex(i);
  };

  if (!visible) return null;

  const isLast = index === TIPS.length - 1;
  const current = TIPS[index];

  return (
    <Modal transparent visible animationType="none" onRequestClose={close} statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: anim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Dismiss tips" />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          {
            opacity: anim,
            transform: [
              { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) },
            ],
          },
        ]}
        accessibilityViewIsModal
      >
        <View style={styles.grabber} />

        <View style={styles.topRow}>
          <Text style={styles.counter}>
            {index + 1} of {TIPS.length}
          </Text>
          <Pressable onPress={close} hitSlop={12} accessibilityRole="button" accessibilityLabel="Skip tips">
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        </View>

        <FlatList
          ref={listRef}
          data={TIPS}
          keyExtractor={(t) => t.title}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item }) => <Slide tip={item} width={width} />}
        />

        <View style={styles.footer}>
          <View style={styles.dots} accessibilityElementsHidden>
            {TIPS.map((t, i) => (
              <View
                key={t.title}
                style={[styles.dot, i === index && { width: 22, backgroundColor: current.color }]}
              />
            ))}
          </View>

          <Pressable
            onPress={() => (isLast ? close() : goTo(index + 1))}
            style={({ pressed }) => [styles.cta, pressed && { opacity: 0.88 }]}
            accessibilityRole="button"
          >
            <Text style={styles.ctaText}>{isLast ? 'Start shopping' : 'Next'}</Text>
            <Ionicons name={isLast ? 'checkmark' : 'arrow-forward'} size={19} color="#fff" />
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(4,47,46,0.55)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 16,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 34 : 22,
    elevation: 24,
    shadowColor: INK,
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D5E4E2',
    marginBottom: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 14,
  },
  counter: { fontSize: 13, fontWeight: '600', color: '#5B7573' },
  skip: { fontSize: 14, fontWeight: '700', color: BRAND },

  hero: {
    height: 168,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 22,
  },
  ring: { position: 'absolute', borderWidth: 1.5, borderRadius: 999, opacity: 0.16 },
  ringOuter: { width: 220, height: 220 },
  ringInner: { width: 150, height: 150 },
  tile: { width: 84, height: 84, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },

  chat: { width: '100%', paddingHorizontal: 20 },
  bubble: { maxWidth: '78%', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 18, marginBottom: 8 },
  bubbleThem: { alignSelf: 'flex-start', backgroundColor: '#fff', borderBottomLeftRadius: 5 },
  bubbleYou: { alignSelf: 'flex-end', borderBottomRightRadius: 5 },
  bubbleThemText: { fontSize: 14, color: INK, fontWeight: '500' },
  bubbleYouText: { fontSize: 14, color: '#fff', fontWeight: '600' },
  chatChip: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: '#fff',
  },
  chatChipText: { marginLeft: 6, fontSize: 12.5, fontWeight: '700', color: '#0F766E' },

  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3, color: INK, marginBottom: 8 },
  text: { fontSize: 15, lineHeight: 23, color: '#4B6563', minHeight: 70 },

  footer: { paddingHorizontal: 24, marginTop: 8 },
  dots: { flexDirection: 'row', alignSelf: 'center', marginBottom: 18 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#D5E4E2', marginHorizontal: 3 },
  cta: {
    height: 54,
    borderRadius: 16,
    backgroundColor: BRAND,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700', marginRight: 8 },
});