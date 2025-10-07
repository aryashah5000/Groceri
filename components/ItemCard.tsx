import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Item } from '../types/item';
import { currency, theme } from '../theme';


// Extend the ItemCard props to optionally control whether to show
// detailed information such as price and deal tags. When
// `showDetails` is false, the card will only display the image and
// name of the item. By default, details are shown.
interface ItemCardProps {
    item: Item;
    /**
     * When true (default), the card shows the item's price and deal tag.
     * When false, these details are hidden until triggered externally.
     */
    showDetails?: boolean;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, showDetails = true }) => {
  // Determine the chip color based on the deal tag. We support three tags:
  // DEAL (green), SO-SO (orange), and NO DEAL (red). Defaults to gray if
  // undefined.
  const { backgroundColor: tagBg, textColor: tagColor } = React.useMemo(() => {
    switch (item.tag) {
      case 'DEAL':
        return { backgroundColor: '#EAFBF1', textColor: '#0B8F4D' };
      case 'SO-SO':
        return { backgroundColor: '#FEF3C7', textColor: '#B45309' };
      case 'NO DEAL':
        return { backgroundColor: '#FFF1F1', textColor: '#C0382B' };
      default:
        return { backgroundColor: '#F1F5F9', textColor: '#64748B' };
    }
  }, [item.tag]);

  return (
    <View style={styles.row}>
      {/* Always display the item image */}
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={{ flex: 1 }}>
        {/* Name and optional organic label */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
          {item.isOrganic && (
            <Text style={styles.organicLabel}> (Organic)</Text>
          )}
        </View>
        {/* Store name, shown when available */}
        {item.store && (
          <Text style={styles.store}>{item.store}</Text>
        )}
        {/* Conditionally render price, tag and recommendations based on showDetails */}
        {showDetails && (
          <>
            <Text style={styles.price}>{currency(item.price)}</Text>
            {item.tag && (
              <View style={[styles.tag, { backgroundColor: tagBg }]}>
                <Text style={[styles.tagText, { color: tagColor }]}>{item.tag}</Text>
              </View>
            )}
            {/* Show recommendations if provided */}
            {item.recommendations && item.recommendations.length > 0 && (
              <View style={styles.recoContainer}>
                <Text style={styles.recoTitle}>Other deals:</Text>
                {item.recommendations.map((rec) => (
                  <Text key={rec.id} style={styles.recoItem} numberOfLines={2}>
                    {rec.store}: {currency(rec.price)}{rec.distance !== undefined ? ` – ${rec.distance.toFixed(1)} mi` : ''}
                  </Text>
                ))}
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
    row: { flexDirection: 'row', gap: 12 },
    image: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#f2f2f2' },
    name: { fontSize: 14, color: theme.text, fontWeight: '600' },
    organicLabel: { fontSize: 13, color: '#16A34A', fontStyle: 'italic' },
    store: { fontSize: 12, color: theme.sub },
    price: { marginTop: 6, fontSize: 13, color: theme.text, fontWeight: '700' },
    tag: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 999,
        marginTop: 6,
    },
    tagText: { fontSize: 11, fontWeight: '700' },
    recoContainer: { marginTop: 8 },
    recoTitle: { fontSize: 12, color: theme.sub, marginBottom: 2 },
    recoItem: { fontSize: 12, color: theme.sub },
});


export default ItemCard;