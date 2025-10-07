import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useHistory } from '../../contexts/HistoryContext';
import type { Item, Recommendation } from '../../types/item';
import { fetchProductWithDeals } from '../../api';
import { theme, currency } from '../../theme';


/**
 * Evaluate a scanned item against nearby items. Given the user's current
 * location and a radius (in miles), find other items with the same name and
 * organic status, compute distances, and determine whether the scanned item is
 * a best deal, a so‑so deal, or not a good deal. Generate a list of
 * recommendations accordingly.
 */
function evaluateDeal(
  scanned: Item,
  deals: Recommendation[],
): Item {
  // Determine tag by comparing scanned price with cheapest deal
  let tag: Item['tag'] = scanned.tag;
  let recommendations: Item['recommendations'] | undefined;
  const margin = 0.05; // ±5% difference considered so‑so
  if (deals.length > 0) {
    const cheapest = deals[0];
    if (scanned.price <= cheapest.price) {
      tag = 'DEAL';
      recommendations = deals.slice(0, 2);
    } else if (scanned.price <= cheapest.price * (1 + margin)) {
      tag = 'SO-SO';
      recommendations = deals.filter(
        (d) => Math.abs(d.price - scanned.price) / scanned.price <= margin,
      );
    } else {
      tag = 'NO DEAL';
      recommendations = deals.slice(0, 3);
    }
  } else {
    // No competitor deals; default tag if undefined
    tag = tag ?? 'DEAL';
    recommendations = undefined;
  }
  return { ...scanned, tag, recommendations };
}

export default function ScannerModal() {
  const router = useRouter();
  const { addItem } = useHistory();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions();
  const [isProcessing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When a barcode is scanned, this handler resolves the item via
  // external APIs and appends it to history with deal evaluation.
  const handleBarcodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (isProcessing) return;
      setProcessing(true);
      try {
        // Ensure we have location permission and fetch coordinates
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
          setError('Location permission is required to evaluate deals.');
          return;
        }
        // Use geolocation and the scanned UPC to fetch product and competitor deals
        const { item: product, deals } = await fetchProductWithDeals(
          data,
          coords.latitude,
          coords.longitude,
          5,
        );
        if (!product) {
          setError(`No product found for code ${data}`);
          return;
        }
        // Attach coordinates to the scanned product if available
        const evaluated = evaluateDeal(product, deals);
        // Append to history
        addItem(evaluated);
        router.back();
      } catch (e: any) {
        setError(e?.message ?? 'Unknown error');
      } finally {
        setProcessing(false);
      }
    },
    [isProcessing, locationPermission, requestLocationPermission, addItem, router],
  );

  // When the modal is focused, reset error state.
  useEffect(() => {
    setError(null);
  }, []);

  // Render permission requests or the camera view
  if (!cameraPermission) {
    return <View style={styles.centered} />;
  }
  if (!cameraPermission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>We need your permission to use the camera.</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => requestCameraPermission()}
        >
          <Text style={styles.buttonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      {/* CameraView automatically scans barcodes when onBarcodeScanned is provided */}
      <CameraView
        style={StyleSheet.absoluteFill}
        onBarcodeScanned={handleBarcodeScanned}
        barcodeScannerSettings={{
          // Scan common grocery bar code formats. QR is included for completeness.
          barcodeTypes: ['ean13', 'ean8', 'upc_e', 'qr', 'code39', 'code93', 'code128'],
        }}
      />
      {/* Overlay for instructions and error messages */}
      <View style={styles.overlay}>
        <Text style={styles.instructions}>Point the camera at a barcode</Text>
        {error && <Text style={styles.error}>{error}</Text>}
        {isProcessing && <ActivityIndicator size="large" color={theme.primary} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: theme.text,
    marginBottom: 12,
  },
  button: {
    backgroundColor: theme.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  overlay: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructions: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  error: {
    color: '#ff6666',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
});