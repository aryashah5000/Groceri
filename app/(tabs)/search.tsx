import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import HeaderBar from '../../components/HeaderBar';
import ItemCard from '../../components/ItemCard';
import EmptyState from '../../components/EmptyState';
import * as Location from 'expo-location';
import { searchProducts } from '../../api';
import type { Item } from '../../types/item';
import { theme } from '../../theme';
export default function SearchScreen() {
    const inputRef = useRef<TextInput>(null);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Item[]>([]);
    const [loading, setLoading] = useState(false);
    // Track which items are expanded to reveal details when searching.
    const [expandedIds, setExpandedIds] = useState<string[]>([]);
    const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions();

    const toggleItem = (id: string) => {
        // animate expand/collapse
        if (Platform.OS === 'android' && LayoutAnimation.configureNext) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        } else {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        }
        setExpandedIds((ids) =>
            ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]
        );
    };

    // Fetch search results whenever the query changes. If location
    // permission is not yet granted, request it. Without location,
    // geolocation-based filtering cannot be performed.
    useEffect(() => {
        let cancelled = false;
        async function search() {
            const q = query.trim();
            if (!q) {
                setResults([]);
                return;
            }
            // Ensure location
            let coords: { latitude: number; longitude: number } | null = null;
            if (locationPermission?.granted) {
                const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
            } else {
                if (locationPermission?.canAskAgain) {
                    await requestLocationPermission();
                }
                if (locationPermission?.granted) {
                    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                    coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
                }
            }
            if (!coords) {
                setResults([]);
                return;
            }
            setLoading(true);
            try {
                const items = await searchProducts(q, coords.latitude, coords.longitude, 5);
                if (!cancelled) setResults(items);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        search();
        return () => {
            cancelled = true;
        };
    }, [query, locationPermission]);

    return (
        <SafeAreaView style={styles.screen}>
            <StatusBar style="dark" />
            <HeaderBar title="Search" />

            <View style={styles.searchBox}>
                <Ionicons
                    name="search"
                    size={18}
                    color={theme.sub}
                    style={{ marginRight: 8 }}
                />
                <TextInput
                    ref={inputRef}
                    style={styles.searchInput}
                    placeholder="Search for items here…"
                    placeholderTextColor={theme.sub}
                    value={query}
                    onChangeText={setQuery}
                    returnKeyType="search"
                    autoCorrect={false}
                />
                {!!query && (
                    <TouchableOpacity onPress={() => setQuery('')}>
                        <Ionicons name="close-circle" size={18} color={theme.sub} />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.card}>
                {query.length === 0 ? (
                    <EmptyState label="No items found." />
                ) : loading ? (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: theme.sub }}>Searching…</Text>
                    </View>
                ) : results.length === 0 ? (
                    <EmptyState label="No results." />
                ) : (
                    <FlatList
                        data={results}
                        keyExtractor={(i) => i.id}
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
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                        ListHeaderComponent={() => (
                            <Text style={styles.section}>Results</Text>
                        )}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.bg },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: theme.line,
    },
    searchInput: { flex: 1, fontSize: 14, color: theme.text },
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