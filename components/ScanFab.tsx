import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';


const ScanFab: React.FC<{ onPress: () => void; label?: string }> = ({ onPress, label = 'Scan Barcode' }) => (
    <TouchableOpacity style={styles.fab} activeOpacity={0.9} onPress={onPress}>
        <Ionicons name="barcode-outline" size={18} color="#fff" />
        <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
);


const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        alignSelf: 'center',
        bottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: theme.primary,
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 999,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
    },
    text: { color: '#fff', fontWeight: '700' },
});


export default ScanFab;