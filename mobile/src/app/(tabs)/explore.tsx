import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { UnifiedPageShell } from '@/components/UnifiedPageShell';
import { AGRI_SHOP_ROUTE } from '@/utils/navigation';

const GREEN = '#15803D';
const BACKGROUND = '#F7F9F7';

interface ToolItem {
  iconType: 'feather' | 'mci';
  iconName: string;
  title: string;
  description: string;
  route?: any;
}

const farmingTools: ToolItem[] = [
  {
    iconType: 'mci',
    iconName: 'microscope',
    title: 'Crop Doctor',
    description: 'Identify crop diseases from leaf images.',
    route: '/crop-doctor',
  },
  {
    iconType: 'feather',
    iconName: 'layers',
    title: 'Crop Recommendations',
    description: 'Discover suitable crops for your soil and climate.',
    route: '/crop-advisor',
  },
  {
    iconType: 'mci',
    iconName: 'robot-outline',
    title: 'AI Farming Assistant',
    description: 'Get help with farming questions and practices.',
    route: '/ai-assistant',
  },
  {
    iconType: 'feather',
    iconName: 'cloud-rain',
    title: 'Weather Advisory',
    description: 'Stay informed about weather conditions for farming.',
    route: '/weather-irrigation',
  },
  {
    iconType: 'feather',
    iconName: 'shopping-bag',
    title: 'Agriculture Marketplace',
    description: 'Explore agricultural products and farming supplies.',
    route: AGRI_SHOP_ROUTE,
  },
  {
    iconType: 'feather',
    iconName: 'droplet',
    title: 'Smart Irrigation',
    description: 'Explore smarter ways to manage water for crops.',
    route: '/weather-irrigation',
  },
];

export default function ExploreScreen() {
  return (
    <UnifiedPageShell
      activeRoute="/"
      title="Explore Platform"
      subtitle="Intelligent tools for modern agriculture"
      statusPillText="8 AI Engines Active"
      scrollable={true}
    >
      <View style={styles.content}>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Explore Smart Farming</Text>

          <Text style={styles.bannerDescription}>
            Explore intelligent tools designed to support better farming
            decisions.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Explore Services</Text>

        {farmingTools.map((tool) => (
          <TouchableOpacity
            key={tool.title}
            style={styles.toolCard}
            activeOpacity={0.75}
            onPress={() => {
              if (tool.route) {
                router.push(tool.route as any);
              }
            }}
          >
            <View style={styles.iconContainer}>
              {tool.iconType === 'mci' ? (
                <MaterialCommunityIcons
                  name={tool.iconName as any}
                  size={22}
                  color={GREEN}
                />
              ) : (
                <Feather
                  name={tool.iconName as any}
                  size={20}
                  color={GREEN}
                />
              )}
            </View>

            <View style={styles.toolContent}>
              <Text style={styles.toolTitle}>{tool.title}</Text>

              <Text style={styles.toolDescription}>
                {tool.description}
              </Text>

              {tool.route && (
                <Text style={styles.openText}>Tap to open →</Text>
              )}
            </View>

            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Growing a smarter and greener future
          </Text>
        </View>
      </View>
    </UnifiedPageShell>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  content: {
    padding: 20,
    paddingBottom: 35,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },

  headerIcon: {
    fontSize: 30,
    marginRight: 10,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: GREEN,
  },

  banner: {
    backgroundColor: GREEN,
    padding: 22,
    borderRadius: 20,
    marginBottom: 28,
  },

  bannerTitle: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },

  bannerDescription: {
    fontSize: 15,
    color: '#E8F5E9',
    lineHeight: 23,
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#243B28',
    marginBottom: 16,
  },

  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5EDE3',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },

  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#EAF5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  toolIcon: {
    fontSize: 27,
  },

  toolContent: {
    flex: 1,
  },

  toolTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#263B29',
    marginBottom: 5,
  },

  toolDescription: {
    fontSize: 13,
    color: '#68756A',
    lineHeight: 19,
  },

  openText: {
    color: GREEN,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 7,
  },

  arrow: {
    fontSize: 27,
    color: GREEN,
    marginLeft: 8,
  },

  footer: {
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 15,
  },

  footerText: {
    fontSize: 13,
    color: '#778477',
    textAlign: 'center',
  },
});