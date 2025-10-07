import React, { createContext, useContext, useState } from 'react';
import type { Item } from '../types/item';

/**
 * A React context for storing the user's scan history. This allows
 * components throughout the app to access and update the list of
 * scanned items without prop drilling. Each item added to history
 * should already contain any computed deal information (price tag,
 * recommendations, etc.).
 */
interface HistoryContextValue {
  /**
   * Array of items that have been scanned by the user. New items are
   * added to the beginning of the array (most recent first).
   */
  history: Item[];
  /**
   * Push a new item into the history. The newest item appears at the
   * beginning of the list. Duplicate IDs are allowed; callers can
   * decide whether to de‑duplicate before invoking addItem.
   */
  addItem: (item: Item) => void;
  /**
   * Remove all items from the history. Useful if the user wants to
   * start over or clear out old scans.
   */
  clear: () => void;
}

const HistoryContext = createContext<HistoryContextValue | undefined>(
  undefined,
);

export const HistoryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [history, setHistory] = useState<Item[]>([]);
  const addItem = (item: Item) =>
    setHistory((prev) => [item, ...prev]);
  const clear = () => setHistory([]);
  return (
    <HistoryContext.Provider value={{ history, addItem, clear }}>
      {children}
    </HistoryContext.Provider>
  );
};

/**
 * Hook to access the scan history context. Throws if used outside of
 * HistoryProvider.
 */
export const useHistory = (): HistoryContextValue => {
  const ctx = useContext(HistoryContext);
  if (!ctx) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return ctx;
};