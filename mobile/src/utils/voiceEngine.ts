/**
 * voiceEngine.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Universal cross-platform voice engine for Future Farming.
 * Works reliably on Android, iOS (via expo-speech + expo-av) and Expo Web
 * (via window.speechSynthesis + HTML5 Audio) in English (en-IN), Marathi
 * (mr-IN), and Hindi (hi-IN).
 *
 * Usage:
 *   import { speakUniversalText, stopAllVoicePlayback, SupportedVoiceLang }
 *     from '@/utils/voiceEngine';
 *
 *   await speakUniversalText(text, 'mr',
 *     () => setIsPlaying(true),   // onStart
 *     () => setIsPlaying(false)   // onFinish
 *   );
 *
 *   await stopAllVoicePlayback(); // call to cancel mid-stream
 */

import { Platform } from 'react-native';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

export type SupportedVoiceLang = 'en' | 'mr' | 'hi';

// ─── Module-level state (single active playback at a time) ─────────────────
let isCancelled = false;
let activeWebAudio: HTMLAudioElement | null = null;
let activeNativeSound: Audio.Sound | null = null;

// ─── 1. Text chunker ───────────────────────────────────────────────────────
/**
 * Splits long text into ≤150-character sentence chunks so neither Android/iOS
 * TTS nor the Cloud TTS stream cuts off mid-sentence.
 */
function splitIntoChunks(text: string, maxLen = 150): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];

  // Split on Devanagari danda (।), common punctuation, and newlines
  const rawParts = cleaned.split(/(?<=[।॥.!?;\n])\s*/);
  const chunks: string[] = [];

  for (const part of rawParts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.length <= maxLen) {
      chunks.push(trimmed);
    } else {
      // Word-level split for very long runs
      const words = trimmed.split(' ');
      let current = '';
      for (const word of words) {
        if ((current + ' ' + word).trim().length > maxLen) {
          if (current) chunks.push(current.trim());
          current = word;
        } else {
          current = (current + ' ' + word).trim();
        }
      }
      if (current) chunks.push(current.trim());
    }
  }

  return chunks.length > 0 ? chunks : [cleaned.slice(0, maxLen)];
}

// ─── 2. Stop all playback ──────────────────────────────────────────────────
/**
 * Immediately stops all active speech across Mobile Native and Web.
 * Call this before starting a new utterance, and in useEffect cleanup.
 */
export async function stopAllVoicePlayback(): Promise<void> {
  isCancelled = true;

  // Mobile: expo-speech
  if (Platform.OS !== 'web') {
    try {
      await Speech.stop();
    } catch (_) {
      // ignore
    }
  }

  // Mobile: expo-av cloud audio stream
  if (activeNativeSound) {
    try {
      await activeNativeSound.stopAsync();
      await activeNativeSound.unloadAsync();
    } catch (_) {
      // ignore
    }
    activeNativeSound = null;
  }

  // Web: speechSynthesis + HTML5 Audio
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch (_) {
      // ignore
    }
    if (activeWebAudio) {
      try {
        activeWebAudio.pause();
        activeWebAudio.currentTime = 0;
      } catch (_) {
        // ignore
      }
      activeWebAudio = null;
    }
  }
}

// ─── 3. Cloud TTS stream fallback ─────────────────────────────────────────
/**
 * Streams TTS audio chunks via:
 *   - expo-av Audio.Sound on Mobile (Android / iOS)
 *   - HTML5 <Audio> on Web
 *
 * Guarantees Marathi, Hindi & English voices work even when the device
 * lacks a local TTS voice pack.
 */
async function playChunksViaCloudStream(
  chunks: string[],
  lang: SupportedVoiceLang,
  onFinish?: () => void
): Promise<void> {
  const tl = lang === 'mr' ? 'mr' : lang === 'hi' ? 'hi' : 'en-IN';

  // Configure audio session once before looping (Mobile only)
  if (Platform.OS !== 'web') {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (_) {
      // ignore – best-effort
    }
  }

  for (let i = 0; i < chunks.length; i++) {
    if (isCancelled) break;

    const chunk = chunks[i];
    const url =
      `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${tl}&q=` +
      encodeURIComponent(chunk);

    if (Platform.OS !== 'web') {
      // ── Android / iOS via expo-av ──────────────────────────────────────
      await new Promise<void>(async (resolve) => {
        try {
          if (activeNativeSound) {
            await activeNativeSound.unloadAsync().catch(() => {});
            activeNativeSound = null;
          }

          const { sound } = await Audio.Sound.createAsync(
            { uri: url },
            { shouldPlay: true, volume: 1.0 }
          );
          activeNativeSound = sound;

          sound.setOnPlaybackStatusUpdate((status) => {
            if (!status.isLoaded) {
              resolve();
              return;
            }
            if (status.didJustFinish) {
              sound.unloadAsync().catch(() => {});
              activeNativeSound = null;
              resolve();
            }
          });
        } catch (_) {
          resolve();
        }
      });
    } else if (typeof window !== 'undefined') {
      // ── Expo Web via HTML5 Audio ───────────────────────────────────────
      await new Promise<void>((resolve) => {
        try {
          const audio = new window.Audio(url);
          activeWebAudio = audio;
          audio.onended = () => resolve();
          audio.onerror = () => resolve();
          audio.play().catch(() => resolve());
        } catch (_) {
          resolve();
        }
      });
    }
  }

  if (!isCancelled && onFinish) {
    onFinish();
  }
}

// ─── 4. Primary universal speak function ──────────────────────────────────
/**
 * Speak `text` in the given language on Android, iOS, and Expo Web.
 *
 * Strategy (Mobile):
 *   1. Try expo-speech with a matched native voice.
 *   2. If no Marathi/Hindi voice pack exists on the device, or expo-speech
 *      errors, fall back to Google Translate Cloud TTS via expo-av.
 *
 * Strategy (Web):
 *   1. Try window.speechSynthesis with a matched voice.
 *   2. If no Marathi/Hindi voice is available, fall back to Cloud TTS via
 *      HTML5 Audio.
 *
 * @param text     Full text to read aloud (may be multi-paragraph).
 * @param lang     'en' | 'mr' | 'hi'
 * @param onStart  Called just before the first audio chunk plays.
 * @param onFinish Called after the last chunk completes (not called if cancelled).
 */
export async function speakUniversalText(
  text: string,
  lang: SupportedVoiceLang,
  onStart?: () => void,
  onFinish?: () => void
): Promise<void> {
  // Always stop any previous stream before starting a new one
  await stopAllVoicePlayback();
  isCancelled = false;

  const chunks = splitIntoChunks(text, 150);
  if (chunks.length === 0) {
    onFinish?.();
    return;
  }

  onStart?.();

  // ════════════════════════════════════════════════════════════════════════
  // A. MOBILE NATIVE (Android & iOS)
  // ════════════════════════════════════════════════════════════════════════
  if (Platform.OS !== 'web') {
    try {
      const voices = await Speech.getAvailableVoicesAsync().catch(() => []);
      const targetLocale =
        lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';

      // Match the best available local voice
      let matchedVoice = voices.find((v) =>
        v.language
          ?.toLowerCase()
          .startsWith(lang === 'mr' ? 'mr' : lang === 'hi' ? 'hi' : 'en-in')
      );

      // Devanagari fallback: Marathi → Hindi voice (same script)
      if (!matchedVoice && lang === 'mr') {
        matchedVoice = voices.find((v) =>
          v.language?.toLowerCase().startsWith('hi')
        );
      }
      // English fallback: any English voice
      if (!matchedVoice && lang === 'en') {
        matchedVoice = voices.find((v) =>
          v.language?.toLowerCase().startsWith('en')
        );
      }

      // If device has voices but NONE matching Devanagari → use Cloud TTS
      if (
        (lang === 'mr' || lang === 'hi') &&
        voices.length > 0 &&
        !matchedVoice
      ) {
        await playChunksViaCloudStream(chunks, lang, onFinish);
        return;
      }

      // Speak each chunk sequentially via expo-speech
      for (let i = 0; i < chunks.length; i++) {
        if (isCancelled) break;
        const chunk = chunks[i];

        const spokeOk = await new Promise<boolean>((resolve) => {
          let settled = false;
          const finish = (ok: boolean) => {
            if (!settled) {
              settled = true;
              resolve(ok);
            }
          };

          try {
            Speech.speak(chunk, {
              language: matchedVoice?.language || targetLocale,
              voice: matchedVoice?.identifier,
              pitch: 1.0,
              rate: lang === 'en' ? 0.96 : 0.9,
              onDone: () => finish(true),
              onStopped: () => finish(true),
              onError: () => finish(false),
            });
          } catch (_) {
            finish(false);
          }
        });

        // If expo-speech errored mid-stream, switch the rest to Cloud TTS
        if (!spokeOk && !isCancelled) {
          await playChunksViaCloudStream(chunks.slice(i), lang, onFinish);
          return;
        }
      }

      if (!isCancelled) onFinish?.();
      return;
    } catch (_) {
      // expo-speech threw unexpectedly → fall back to Cloud TTS
      await playChunksViaCloudStream(chunks, lang, onFinish);
      return;
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // B. EXPO WEB
  // ════════════════════════════════════════════════════════════════════════
  if (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    'speechSynthesis' in window
  ) {
    const voices = window.speechSynthesis.getVoices();

    let matchedVoice = voices.find((v) =>
      v.lang
        .toLowerCase()
        .startsWith(lang === 'mr' ? 'mr' : lang === 'hi' ? 'hi' : 'en-in')
    );
    if (!matchedVoice && lang === 'mr') {
      matchedVoice = voices.find((v) => v.lang.toLowerCase().startsWith('hi'));
    }
    if (!matchedVoice && lang === 'en') {
      matchedVoice = voices.find((v) => v.lang.toLowerCase().startsWith('en'));
    }

    // No Devanagari voice available in browser → Cloud TTS
    if ((lang === 'mr' || lang === 'hi') && !matchedVoice) {
      await playChunksViaCloudStream(chunks, lang, onFinish);
      return;
    }

    for (let i = 0; i < chunks.length; i++) {
      if (isCancelled) break;
      const chunk = chunks[i];

      await new Promise<void>((resolve) => {
        const utter = new SpeechSynthesisUtterance(chunk);
        if (matchedVoice) utter.voice = matchedVoice;
        utter.lang =
          matchedVoice?.lang ||
          (lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN');
        utter.rate = 0.95;
        utter.onend = () => resolve();
        utter.onerror = () => resolve();
        window.speechSynthesis.speak(utter);
      });
    }

    if (!isCancelled) onFinish?.();
    return;
  }

  // Web but no speechSynthesis (rare) → Cloud TTS
  await playChunksViaCloudStream(chunks, lang, onFinish);
}

