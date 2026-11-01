import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Feather } from '@expo/vector-icons';

import { ShopColors } from '@/constants/agri-shop-theme';
import { getDiseaseOptions } from '@/utils/recommendationEngine';

interface DiseasePickerProps {
  value?: string | null;
  onSelect: (disease: string) => void;
  label?: string;
  tone?: 'light' | 'dark';
  compact?: boolean;
}

export function DiseasePicker({
  value,
  onSelect,
  label = 'Change disease',
  tone = 'light',
  compact = false,
}: DiseasePickerProps) {
  const [open, setOpen] = useState(false);
  const dark = tone === 'dark';

  const handleSelect = (disease: string) => {
    onSelect(disease);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.trigger,
          dark ? styles.triggerDark : styles.triggerLight,
          compact && styles.triggerCompact,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${label}. Current selection: ${value ?? 'none'}`}
      >
        <View style={styles.triggerTextBlock}>
          <Text
            style={[
              styles.triggerLabel,
              dark ? styles.textOnDarkMuted : styles.triggerLabelLight,
            ]}
          >
            {label}
          </Text>
          <Text
            style={[
              styles.triggerValue,
              dark ? styles.textOnDark : styles.triggerValueLight,
            ]}
            numberOfLines={1}
          >
            {value ?? 'Choose a disease'}
          </Text>
        </View>
        <Text
          style={[
            styles.chevron,
            dark ? styles.textOnDark : styles.triggerValueLight,
          ]}
        >
          ▾
        </Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setOpen(false)}
            accessibilityLabel="Close disease selector"
          />

          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleBlock}>
                <Text style={styles.sheetEyebrow}>CROP DOCTOR</Text>
                <Text style={styles.sheetTitle}>Switch diagnosis</Text>
              </View>

              <Pressable
                onPress={() => setOpen(false)}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Feather name="x" size={18} color="#4B5563" />
              </Pressable>
            </View>

            <Text style={styles.sheetHint}>
              Choose a disease to test a different AI treatment bundle.
            </Text>

            <ScrollView
              style={styles.list}
              showsVerticalScrollIndicator={false}
            >
              {getDiseaseOptions().map((profile) => {
                const selected = profile.disease === value;

                return (
                  <Pressable
                    key={profile.disease}
                    onPress={() => handleSelect(profile.disease)}
                    style={({ pressed }) => [
                      styles.option,
                      selected && styles.optionSelected,
                      pressed && styles.optionPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <View style={styles.optionBody}>
                      <View style={styles.optionTitleRow}>
                        <Text style={styles.optionTitle}>
                          {profile.disease}
                        </Text>
                        {selected ? (
                          <View style={styles.selectedPill}>
                            <Text style={styles.selectedPillText}>
                              ACTIVE
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      <Text style={styles.optionMeta}>
                        Typical host: {profile.defaultCrop} ·{' '}
                        {profile.defaultSeverity} severity
                      </Text>
                    </View>

                    <Text style={styles.optionChevron}>›</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.sheetFootnote}>
              Switching the diagnosis updates product matches across the shop.
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 13,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    minWidth: 190,
    maxWidth: 300,
  },
  triggerLight: {
    backgroundColor: ShopColors.white,
    borderWidth: 1,
    borderColor: ShopColors.chipBorder,
  },
  triggerDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  triggerCompact: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 160,
  },
  triggerTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  triggerLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  triggerLabelLight: {
    color: ShopColors.muted,
  },
  triggerValue: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  triggerValueLight: {
    color: ShopColors.primaryDark,
  },
  textOnDark: {
    color: ShopColors.white,
  },
  textOnDarkMuted: {
    color: '#CBE8C9',
  },
  chevron: {
    fontSize: 13,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(16, 42, 19, 0.58)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  sheet: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '86%',
    backgroundColor: ShopColors.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: ShopColors.border,
    padding: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  sheetTitleBlock: {
    flex: 1,
  },
  sheetEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: ShopColors.primary,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: ShopColors.heading,
    marginTop: 4,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: ShopColors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 14,
    fontWeight: '700',
    color: ShopColors.heading,
  },
  sheetHint: {
    fontSize: 12,
    lineHeight: 18,
    color: ShopColors.muted,
    marginTop: 8,
    marginBottom: 14,
  },
  list: {
    flexGrow: 0,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: ShopColors.border,
    backgroundColor: '#FAFCF9',
    marginBottom: 9,
  },
  optionSelected: {
    borderColor: ShopColors.primary,
    backgroundColor: ShopColors.softGreen,
  },
  optionPressed: {
    opacity: 0.75,
  },
  optionBody: {
    flex: 1,
    minWidth: 0,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: ShopColors.heading,
  },
  optionMeta: {
    fontSize: 11,
    color: ShopColors.muted,
    marginTop: 3,
  },
  optionChevron: {
    fontSize: 20,
    color: ShopColors.primary,
  },
  selectedPill: {
    backgroundColor: ShopColors.primary,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  selectedPillText: {
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: ShopColors.white,
  },
  sheetFootnote: {
    fontSize: 10,
    lineHeight: 15,
    color: ShopColors.soft,
    marginTop: 6,
  },
  pressed: {
    opacity: 0.7,
  },
});
