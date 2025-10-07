import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';


const EmptyState: React.FC<{ label: string; icon?: keyof typeof Ionicons.glyphMap }> = ({ label, icon = 'search' }) => (
    <View style={styles.wrap}>
        <Ionicons name={icon as any} size={32} color={theme.sub} />
        <Text style={styles.text}>{label}</Text>
    </View>
);


const styles = StyleSheet.create({
    wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },
    text: { marginTop: 8, fontSize: 13, color: theme.sub },
});


export default EmptyState;