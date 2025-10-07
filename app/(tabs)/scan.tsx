import React, { useState, useEffect } from 'react';
import {
  FlatList,
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import HeaderBar from '../../components/HeaderBar';
import ItemCard from '../../components/ItemCard';
import EmptyState from '../../components/EmptyState';
import ScanFab from '../../components/ScanFab';
import { useHistory } from '../../contexts/HistoryContext';
import { theme } from '../../theme';

export default function ScanScreen() {
  const router = useRouter();
  // Pull scan history from context instead of local state
  const { history } = useHistory();
  // Track which items have been expanded to show details. When an item
  // identifier is in this list, the corresponding row will display
  // price, deal information and recommendations. Otherwise, only the name
  // and image are shown.
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  /**
   * Toggle the expanded state of an item by its id. If the id is already
   * expanded, collapse it; otherwise, expand it. Use LayoutAnimation to
   * smoothly animate the change. On Android, enable experimental
   * animations at runtime.
   */
  const toggleItem = (id: string) => {
    if (Platform.OS === 'android' && LayoutAnimation.configureNext) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    } else {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setExpandedIds((ids) =>
      ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id],
    );
  };

  /**
   * Navigate to the scanner modal. The scanner handles barcode capture
   * and evaluation; when an item is scanned it will be automatically
   * appended to the history context.
   */
  const handleOpenScanner = () => {
    router.push('/scanner');
  };

  // Animate list updates when history changes. This makes newly scanned
  // items smoothly appear in the list. Without this, additions are
  // instantaneous and may feel abrupt. We only trigger when the history
  // length changes so toggling does not re-run the animation.
  useEffect(() => {
    if (Platform.OS === 'android' && LayoutAnimation.configureNext) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    } else {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
  }, [history.length]);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <HeaderBar title="Scan" />
      <View style={styles.card}>
        {history.length === 0 ? (
          <EmptyState label="No items found." />
        ) : (
          <FlatList
            data={history}
            keyExtractor={(i) => i.id}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => toggleItem(item.id)}
              >
                <ItemCard
                  item={item}
                  showDetails={expandedIds.includes(item.id)}
                />
              </TouchableOpacity>
            )}
            ListHeaderComponent={() => <Text style={styles.section}>History</Text>}
          />
        )}
      </View>
      {/* Leave space for the floating action button */}
      <View style={{ height: 80 }} />
      <ScanFab onPress={handleOpenScanner} />
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.bg },
    card: {
        flex: 1,
        backgroundColor: theme.card,
        marginHorizontal: 16,
        borderRadius: 12,
        paddingVertical: 6,
        paddingHorizontal: 10,
        shadowColor: '#000',
        shadowOpacity: 0.07,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
    },
    section: { fontSize: 12, color: theme.sub, marginVertical: 8 },
    separator: { height: 1, backgroundColor: theme.line, marginVertical: 10 },
});