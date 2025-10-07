import React from 'react';
import { Stack } from 'expo-router';

/**
 * This layout defines a modal presentation style for any routes
 * inside the `(modals)` group. Screens presented from this group will
 * slide up from the bottom on iOS and fade on Android, matching native
 * modal behavior. We hide the header because modal screens usually
 * manage their own layout or use custom navigation bars.
 */
export default function ModalLayout() {
  return (
    <Stack screenOptions={{ presentation: 'modal', headerShown: false }} />
  );
}