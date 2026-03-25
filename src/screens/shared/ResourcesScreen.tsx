// ============================================================================
// ResourcesScreen - Educational content and resources hub
// ============================================================================

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { SearchBar, Card, EmptyState, LoadingScreen } from '../../components';
import { api } from '../../api';

interface Resource {
  id: string;
  title: string;
  description?: string;
  url?: string;
  category?: string;
  type?: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  contract: 'document-text',
  rights: 'shield-checkmark',
  grievance: 'briefcase',
  training: 'school',
  benefits: 'heart',
  safety: 'warning',
  default: 'library',
};

export function ResourcesScreen() {
  const { theme } = useTheme();
  const { colors } = theme;

  const [resources, setResources] = useState<Resource[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => { loadResources(); }, []);

  async function loadResources() {
    try {
      const result = await api.getResourceStats();
      if (result.success && result.data) {
        // Extract resources from the stats response
        const data = result.data as Record<string, unknown>;
        if (Array.isArray(data.resources)) {
          setResources(data.resources);
        } else if (Array.isArray(data)) {
          setResources(data as Resource[]);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  function handleResourceClick(resource: Resource) {
    // Log the click
    api.logResourceClick(resource.id, resource.title).catch(() => {});

    if (resource.url) {
      Linking.openURL(resource.url);
    }
  }

  const categories = useMemo(() => {
    const cats = new Set<string>();
    resources.forEach(r => { if (r.category) cats.add(r.category); });
    return Array.from(cats);
  }, [resources]);

  const filtered = useMemo(() => {
    let items = resources;
    if (selectedCategory) {
      items = items.filter(r => r.category === selectedCategory);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      items = items.filter(r =>
        r.title?.toLowerCase().includes(s) ||
        r.description?.toLowerCase().includes(s) ||
        r.category?.toLowerCase().includes(s)
      );
    }
    return items;
  }, [resources, search, selectedCategory]);

  if (loading) return <LoadingScreen message="Loading resources..." />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.searchRow}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search resources..." />
      </View>

      {/* Category Filter */}
      {categories.length > 0 && (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[null, ...categories]}
          style={styles.categoryList}
          contentContainerStyle={styles.categoryContent}
          keyExtractor={item => item || 'all'}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedCategory(item)}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: selectedCategory === item ? colors.primary : colors.surface,
                  borderColor: selectedCategory === item ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={{ color: selectedCategory === item ? colors.textOnPrimary : colors.text, fontSize: 13, fontWeight: '500' }}>
                {item || 'All'}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      <FlatList
        data={filtered}
        keyExtractor={item => item.id || item.title}
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="library-outline"
            title="No Resources"
            message={resources.length === 0 ? 'Resources will appear here when your admin adds them.' : 'No resources match your search.'}
          />
        }
        renderItem={({ item }) => {
          const iconKey = (item.category || 'default').toLowerCase();
          const iconName = CATEGORY_ICONS[iconKey] || CATEGORY_ICONS.default;

          return (
            <TouchableOpacity onPress={() => handleResourceClick(item)}>
              <Card style={styles.resourceCard}>
                <View style={styles.resourceRow}>
                  <View style={[styles.resourceIcon, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name={iconName as keyof typeof Ionicons.glyphMap} size={24} color={colors.primary} />
                  </View>
                  <View style={styles.resourceInfo}>
                    <Text style={[styles.resourceTitle, { color: colors.text }]}>{item.title}</Text>
                    {item.description && (
                      <Text style={[styles.resourceDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                        {item.description}
                      </Text>
                    )}
                    {item.category && (
                      <Text style={[styles.resourceCategory, { color: colors.primary }]}>{item.category}</Text>
                    )}
                  </View>
                  {item.url && <Ionicons name="open-outline" size={18} color={colors.textSecondary} />}
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchRow: { paddingHorizontal: 16, paddingTop: 12 },
  categoryList: { maxHeight: 48, marginTop: 8 },
  categoryContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  listContent: { padding: 16, gap: 10 },
  emptyContainer: { flex: 1 },
  resourceCard: { padding: 12 },
  resourceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  resourceIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  resourceInfo: { flex: 1, gap: 4 },
  resourceTitle: { fontSize: 15, fontWeight: '600' },
  resourceDesc: { fontSize: 13, lineHeight: 18 },
  resourceCategory: { fontSize: 12, fontWeight: '500' },
});
