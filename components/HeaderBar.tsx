import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Avatar from './Avatar';
import { theme } from '../theme';


const HeaderBar: React.FC<{ title: string }> = ({ title }) => (
    <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Avatar />
    </View>
);


const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingTop: 4,
        paddingBottom: 12,
    },
    title: { fontSize: 26, fontWeight: '700', color: theme.text },
});


export default HeaderBar;