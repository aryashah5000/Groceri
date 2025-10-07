import React from 'react';
import { Image, View, StyleSheet } from 'react-native';


const Avatar: React.FC<{ size?: number }> = ({ size = 30 }) => (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
        <Image
            source={{
                uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
            }}
            style={{ width: '100%', height: '100%', borderRadius: size / 2 }}
        />
    </View>
);


const styles = StyleSheet.create({
    container: { overflow: 'hidden', borderWidth: 1, borderColor: '#00000010' },
});


export default Avatar;