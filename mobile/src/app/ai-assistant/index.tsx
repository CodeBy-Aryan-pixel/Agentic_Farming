import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ScrollViewInstance,
} from 'react-native';
import { router } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { AssistantProductCard } from '@/components/ai-assistant/assistant-product-card';
import { AssistantSchemeCard } from '@/components/ai-assistant/assistant-scheme-card';
import { UnifiedPageShell } from '@/components/UnifiedPageShell';
import { useFarm } from '@/context/FarmContext';
import {
  ShopColors,
  ShopLayout,
} from '@/constants/agri-shop-theme';
import {
  ASSISTANT_LANGUAGES,
  getAssistantCopy,
  getAssistantStarterPrompts,
  type AssistantCopy,
  type AssistantLanguage,
} from '@/constants/assistant-i18n';
import {
  buildLocalAssistantResponse,
  getAssistantResponse,
  type AssistantQuickAction,
  type AssistantResponse,
} from '@/utils/assistantAgent';
import {
  agriShopRoute,
  govtSchemeRoute,
  GOVT_SCHEMES_ROUTE,
} from '@/utils/navigation';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  response?: AssistantResponse;
  showStarters?: boolean;
}

function createWelcomeMessage(
  id: string,
  language: AssistantLanguage
): ChatMessage {
  const response = buildLocalAssistantResponse('hello', language);

  return {
    id,
    role: 'assistant',
    text: response.replyText,
    response,
    showStarters: true,
  };
}

interface ChatMessageItemProps {
  message: ChatMessage;
  busy: boolean;
  language: AssistantLanguage;
  copy: AssistantCopy;
  starterPrompts: readonly string[];
  onStarterPress: (prompt: string) => void;
  onQuickAction: (action: AssistantQuickAction) => void;
}

function ChatMessageItem({
  message,
  busy,
  language,
  copy,
  starterPrompts,
  onStarterPress,
  onQuickAction,
}: ChatMessageItemProps) {
  if (message.role === 'user') {
    return (
      <View style={styles.userRow}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{message.text}</Text>
        </View>
      </View>
    );
  }

  const response = message.response;
  const schemes = response?.recommendedSchemes ?? [];
  const products = response?.recommendedProducts ?? [];
  const quickActions = response?.quickActions ?? [];

  return (
    <View style={styles.assistantRow}>
      <View style={styles.avatar}>
        <MaterialCommunityIcons name="robot-outline" size={18} color="#15803D" />
      </View>

      <View style={styles.assistantColumn}>
        <View style={styles.assistantLabelRow}>
          <Text style={styles.assistantLabel}>
            {copy.assistantLabel}
          </Text>
          <View style={styles.sourcePill}>
            <Text style={styles.sourceText}>
              {response?.source === 'remote'
                ? copy.sourceRemote
                : copy.sourceLocal}
            </Text>
          </View>
        </View>

        <View style={styles.assistantBubble}>
          <Text style={styles.assistantText}>{message.text}</Text>
        </View>

        {schemes.length > 0 ? (
          <View style={styles.cardSection}>
            <Text style={styles.cardSectionLabel}>
              {copy.recommendedSchemes(schemes.length)}
            </Text>
            <View style={styles.cardStack}>
              {schemes.map((scheme) => (
                <AssistantSchemeCard
                  key={`${message.id}-${scheme.id}`}
                  scheme={scheme}
                  language={language}
                />
              ))}
            </View>
          </View>
        ) : null}

        {products.length > 0 ? (
          <View style={styles.cardSection}>
            <Text style={styles.cardSectionLabel}>
              {copy.recommendedInputs(products.length)}
            </Text>
            <View style={styles.cardStack}>
              {products.map((product) => (
                <AssistantProductCard
                  key={`${message.id}-${product.id}`}
                  product={product}
                  language={language}
                  disease={response?.detectedDisease}
                  crop={response?.detectedCrop}
                />
              ))}
            </View>
          </View>
        ) : null}

        {quickActions.length > 0 ? (
          <View style={styles.quickActions}>
            {quickActions.map((action) => (
              <Pressable
                key={`${message.id}-${action.id}`}
                onPress={() => onQuickAction(action)}
                style={({ pressed }) => [
                  styles.quickAction,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={action.label}
              >
                <Text style={styles.quickActionText}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {message.showStarters ? (
          <View style={styles.starterBlock}>
            <Text style={styles.starterEyebrow}>
              {copy.suggestedQuestions}
            </Text>
            <Text style={styles.starterHint}>{copy.starterHint}</Text>

            <View style={styles.starterGrid}>
              {starterPrompts.map((prompt) => (
                <Pressable
                  key={prompt}
                  onPress={() => onStarterPress(prompt)}
                  disabled={busy}
                  style={({ pressed }) => [
                    styles.starterCard,
                    pressed && styles.starterCardPressed,
                    busy && styles.starterCardDisabled,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={copy.starterAccessibility(
                    prompt
                  )}
                >
                  <View style={styles.starterTopRow}>
                    <Text style={styles.starterTag}>
                      {copy.starterTag}
                    </Text>
                    <Text style={styles.starterArrow}>→</Text>
                  </View>
                  <Text style={styles.starterText}>{prompt}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default function AIAssistantScreen() {
  const { language, setLanguage, isHydrated } = useFarm();
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    createWelcomeMessage('welcome', language),
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isKeyboardHintVisible, setIsKeyboardHintVisible] =
    useState(false);

  const messageSequence = useRef(0);
  const activeRequest = useRef(0);
  const scrollViewRef = useRef<ScrollViewInstance>(null);
  const hasStartedChat = useRef(false);

  const copy = getAssistantCopy(language);
  const starterPrompts = getAssistantStarterPrompts(language);

  const nextMessageId = (role: ChatMessage['role']) => {
    messageSequence.current += 1;
    return `${role}-${messageSequence.current}`;
  };

  const resetChat = useCallback((nextLanguage: AssistantLanguage) => {
    messageSequence.current += 1;
    hasStartedChat.current = false;
    setIsTyping(false);
    setInput('');
    setIsKeyboardHintVisible(false);
    setMessages([
      createWelcomeMessage(
        `welcome-${messageSequence.current}`,
        nextLanguage
      ),
    ]);
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  }, []);

  const didHydrateChat = useRef(false);

  useEffect(() => {
    if (!isHydrated || didHydrateChat.current) return;

    didHydrateChat.current = true;
    resetChat(language);
  }, [isHydrated, language, resetChat]);

  const handleClear = () => {
    activeRequest.current += 1;
    resetChat(language);
  };

  const handleLanguageChange = (nextLanguage: AssistantLanguage) => {
    if (nextLanguage === language) return;

    activeRequest.current += 1;
    setLanguage(nextLanguage);
    resetChat(nextLanguage);
  };

  const handleKeyboardHintPress = () => {
    setIsKeyboardHintVisible(true);
  };

  const handleQuickAction = (action: AssistantQuickAction) => {
    switch (action.type) {
      case 'crop-doctor':
        router.push('/crop-doctor');
        return;
      case 'govt-schemes':
        router.push(GOVT_SCHEMES_ROUTE);
        return;
      case 'agri-shop':
        router.push(
          agriShopRoute({
            disease: action.disease,
            crop: action.crop,
          })
        );
        return;
      case 'scheme':
        if (action.schemeId) {
          router.push(govtSchemeRoute(action.schemeId));
        }
        return;
      default:
        return;
    }
  };

  const handleSend = async (starterPrompt?: string) => {
    const query = (starterPrompt ?? input).trim();
    if (!query || isTyping) return;

    setIsKeyboardHintVisible(false);
    activeRequest.current += 1;
    const requestId = activeRequest.current;
    hasStartedChat.current = true;

    setMessages((current) => [
      ...current,
      {
        id: nextMessageId('user'),
        role: 'user',
        text: query,
      },
    ]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await getAssistantResponse(query, language);
      if (activeRequest.current !== requestId) return;

      setMessages((current) => [
        ...current,
        {
          id: nextMessageId('assistant'),
          role: 'assistant',
          text: response.replyText,
          response,
        },
      ]);
    } catch {
      if (activeRequest.current !== requestId) return;

      setMessages((current) => [
        ...current,
        {
          id: nextMessageId('assistant'),
          role: 'assistant',
          text: copy.chatError,
        },
      ]);
    } finally {
      if (activeRequest.current === requestId) {
        setIsTyping(false);
      }
    }
  };

  const canSend = input.trim().length > 0 && !isTyping;

  return (
    <UnifiedPageShell
      title={copy.headerTitle}
      subtitle="Multilingual agricultural advisory in English, Marathi & Hindi"
      statusText={copy.status}
      backLabel="Back to Home"
      scrollable={false}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.subHeaderControls}>
          <View style={styles.subHeaderLeft}>
            <Text style={styles.languageLabel}>
              {copy.languageSelector}
            </Text>
            <View
              style={styles.languagePill}
              accessibilityLabel={copy.languageSelector}
            >
              {ASSISTANT_LANGUAGES.map((option, index) => (
                <React.Fragment key={option.id}>
                  {index > 0 ? (
                    <Text style={styles.languageSeparator}>|</Text>
                  ) : null}
                  <Pressable
                    onPress={() =>
                      handleLanguageChange(option.id)
                    }
                    style={({ pressed }) => [
                      styles.languageOption,
                      language === option.id &&
                        styles.languageOptionActive,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={copy.languageOption(
                      option.label
                    )}
                    accessibilityState={{
                      selected: language === option.id,
                    }}
                  >
                    <Text
                      style={[
                        styles.languageOptionText,
                        language === option.id &&
                          styles.languageOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                </React.Fragment>
              ))}
            </View>
          </View>

          <Pressable
            onPress={handleClear}
            style={({ pressed }) => [
              styles.clearButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={copy.clearChat}
            hitSlop={6}
          >
            <Feather name="trash-2" size={13} color="#6B7280" style={{ marginRight: 4 }} />
            <Text style={styles.clearButtonText}>
              {copy.clearChat}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.chat}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => {
            if (hasStartedChat.current && isTyping) {
              scrollViewRef.current?.scrollToEnd({ animated: false });
            }
          }}
          ref={scrollViewRef}
        >
          <View style={styles.chatInner}>
            <View style={styles.todayChip}>
              <Text style={styles.todayText}>{copy.today}</Text>
            </View>

            {messages.map((message) => (
              <ChatMessageItem
                key={message.id}
                message={message}
                busy={isTyping}
                language={language}
                copy={copy}
                starterPrompts={starterPrompts}
                onStarterPress={(prompt) => void handleSend(prompt)}
                onQuickAction={handleQuickAction}
              />
            ))}

            {isTyping ? (
              <View style={styles.assistantRow}>
                <View style={styles.avatar}>
                  <MaterialCommunityIcons name="robot-outline" size={18} color="#15803D" />
                </View>

                <View style={styles.typingBubble}>
                  <ActivityIndicator
                    size="small"
                    color={ShopColors.primary}
                  />
                  <Text style={styles.typingText}>
                    {copy.typing}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View style={styles.composerShell}>
          <View style={styles.composerInner}>
            {isKeyboardHintVisible ? (
              <View style={styles.keyboardHint}>
                <Text
                  style={styles.keyboardHintText}
                  accessibilityLiveRegion="polite"
                >
                  {copy.voice.keyboardHint}
                </Text>
                <Pressable
                  onPress={() => setIsKeyboardHintVisible(false)}
                  style={({ pressed }) => [
                    styles.keyboardHintClose,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={copy.voice.keyboardHintDismiss}
                  hitSlop={8}
                >
                  <Text style={styles.keyboardHintCloseText}>×</Text>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.composerRow}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder={copy.placeholder}
                placeholderTextColor={ShopColors.soft}
                style={styles.input}
                multiline
                maxLength={500}
                returnKeyType="send"
                enterKeyHint="send"
                blurOnSubmit={false}
                submitBehavior="submit"
                onSubmitEditing={() => void handleSend()}
                accessibilityLabel={copy.inputAccessibility}
                accessibilityHint={copy.voice.inputHint}
              />

              <Pressable
                onPress={handleKeyboardHintPress}
                style={({ pressed }) => [
                  styles.micButton,
                  isKeyboardHintVisible && styles.micButtonActive,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={copy.voice.keyboardHintButton}
                accessibilityHint={copy.voice.keyboardHint}
                accessibilityState={{
                  expanded: isKeyboardHintVisible,
                }}
              >
                <Feather name="mic" size={18} color="#15803D" />
              </Pressable>

              <Pressable
                onPress={() => void handleSend()}
                disabled={!canSend}
                style={({ pressed }) => [
                  styles.sendButton,
                  !canSend && styles.sendButtonDisabled,
                  pressed && canSend && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={copy.sendMessage}
                accessibilityState={{ disabled: !canSend }}
              >
                <Feather name="send" size={16} color="#FFFFFF" />
              </Pressable>
            </View>

            <Text style={styles.disclaimer}>{copy.disclaimer}</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </UnifiedPageShell>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ShopColors.background,
  },
  flex: {
    flex: 1,
  },
  subHeaderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E6ECE6',
  },
  subHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  header: {
    backgroundColor: ShopColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: ShopColors.border,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  headerInner: {
    width: '100%',
    maxWidth: ShopLayout.maxContentWidth,
    alignSelf: 'center',
    gap: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingLeft: 50,
  },
  languageLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: ShopColors.soft,
    textTransform: 'uppercase',
  },
  languagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ShopColors.mint,
    borderWidth: 1,
    borderColor: ShopColors.border,
    borderRadius: 12,
    paddingHorizontal: 3,
    paddingVertical: 2,
  },
  languageSeparator: {
    fontSize: 9,
    color: ShopColors.soft,
    paddingHorizontal: 1,
  },
  languageOption: {
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  languageOptionActive: {
    backgroundColor: ShopColors.primary,
  },
  languageOptionText: {
    fontSize: 9,
    fontWeight: '800',
    color: ShopColors.primaryDark,
  },
  languageOptionTextActive: {
    color: ShopColors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ShopColors.mint,
    borderWidth: 1,
    borderColor: ShopColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 28,
    lineHeight: 30,
    color: ShopColors.heading,
    marginTop: -3,
  },
  headerTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    color: ShopColors.heading,
    letterSpacing: -0.2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ShopColors.success,
  },
  statusText: {
    flexShrink: 1,
    fontSize: 9,
    fontWeight: '600',
    color: ShopColors.muted,
  },
  clearButton: {
    backgroundColor: ShopColors.mint,
    borderWidth: 1,
    borderColor: ShopColors.chipBorder,
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  clearButtonText: {
    color: ShopColors.primaryDark,
    fontSize: 9,
    fontWeight: '800',
  },
  chat: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
  },
  chatInner: {
    width: '100%',
    maxWidth: 940,
    alignSelf: 'center',
    gap: 16,
  },
  todayChip: {
    alignSelf: 'center',
    backgroundColor: ShopColors.mint,
    borderWidth: 1,
    borderColor: ShopColors.border,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  todayText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    color: ShopColors.soft,
  },
  userRow: {
    alignItems: 'flex-end',
    paddingLeft: '12%',
  },
  userBubble: {
    maxWidth: '100%',
    backgroundColor: ShopColors.primary,
    borderTopLeftRadius: 17,
    borderTopRightRadius: 17,
    borderBottomLeftRadius: 17,
    borderBottomRightRadius: 5,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  userText: {
    color: ShopColors.white,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  assistantRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: ShopColors.softGreen,
    borderWidth: 1,
    borderColor: ShopColors.chipBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 17,
  },
  assistantColumn: {
    flex: 1,
    minWidth: 0,
    gap: 9,
  },
  assistantLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minHeight: 18,
  },
  assistantLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: ShopColors.primary,
  },
  sourcePill: {
    backgroundColor: ShopColors.mint,
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sourceText: {
    fontSize: 7,
    fontWeight: '700',
    color: ShopColors.muted,
  },
  assistantBubble: {
    backgroundColor: ShopColors.surface,
    borderWidth: 1,
    borderColor: ShopColors.border,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  assistantText: {
    fontSize: 12.5,
    lineHeight: 19,
    color: ShopColors.body,
  },
  cardSection: {
    gap: 7,
  },
  cardSectionLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: ShopColors.soft,
  },
  cardStack: {
    gap: 8,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  quickAction: {
    backgroundColor: ShopColors.softGreen,
    borderWidth: 1,
    borderColor: ShopColors.chipBorder,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  quickActionText: {
    color: ShopColors.primaryDeep,
    fontSize: 9.5,
    fontWeight: '800',
  },
  starterBlock: {
    backgroundColor: ShopColors.surface,
    borderWidth: 1,
    borderColor: ShopColors.border,
    borderRadius: 16,
    padding: 13,
  },
  starterEyebrow: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.9,
    color: ShopColors.primary,
  },
  starterHint: {
    fontSize: 10,
    lineHeight: 15,
    color: ShopColors.muted,
    marginTop: 3,
  },
  starterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  starterCard: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 260,
    backgroundColor: '#FAFCF8',
    borderWidth: 1,
    borderColor: ShopColors.border,
    borderRadius: 12,
    padding: 11,
  },
  starterCardPressed: {
    backgroundColor: ShopColors.softGreen,
    borderColor: ShopColors.chipBorder,
  },
  starterCardDisabled: {
    opacity: 0.55,
  },
  starterTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  starterTag: {
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: ShopColors.soft,
  },
  starterArrow: {
    fontSize: 13,
    fontWeight: '800',
    color: ShopColors.primary,
  },
  starterText: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
    color: ShopColors.heading,
    marginTop: 5,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: ShopColors.surface,
    borderWidth: 1,
    borderColor: ShopColors.border,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  typingText: {
    fontSize: 10,
    fontWeight: '600',
    color: ShopColors.muted,
  },
  composerShell: {
    backgroundColor: ShopColors.surface,
    borderTopWidth: 1,
    borderTopColor: ShopColors.border,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 9,
  },
  composerInner: {
    width: '100%',
    maxWidth: 940,
    alignSelf: 'center',
  },
  keyboardHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: ShopColors.softGreen,
    borderWidth: 1,
    borderColor: ShopColors.chipBorder,
    borderRadius: 12,
    paddingLeft: 11,
    paddingRight: 6,
    paddingVertical: 8,
    marginBottom: 8,
  },
  keyboardHintText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '600',
    color: ShopColors.heading,
  },
  keyboardHintClose: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: ShopColors.surface,
    borderWidth: 1,
    borderColor: ShopColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardHintCloseText: {
    fontSize: 17,
    lineHeight: 19,
    color: ShopColors.primaryDeep,
    marginTop: -1,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 110,
    backgroundColor: ShopColors.background,
    borderWidth: 1,
    borderColor: ShopColors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 9,
    fontSize: 12,
    lineHeight: 18,
    color: ShopColors.heading,
    textAlignVertical: 'top',
  },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ShopColors.mint,
    borderWidth: 1,
    borderColor: ShopColors.chipBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonActive: {
    backgroundColor: ShopColors.softGreen,
    borderColor: ShopColors.primary,
  },
  micButtonText: {
    fontSize: 17,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ShopColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: ShopColors.mint,
    borderWidth: 1,
    borderColor: ShopColors.border,
  },
  sendButtonText: {
    color: ShopColors.white,
    fontSize: 17,
    fontWeight: '800',
    marginLeft: 2,
  },
  sendButtonTextDisabled: {
    color: ShopColors.disabled,
  },
  disclaimer: {
    textAlign: 'center',
    fontSize: 8,
    lineHeight: 12,
    color: ShopColors.soft,
    marginTop: 6,
  },
  pressed: {
    opacity: 0.72,
  },
});
