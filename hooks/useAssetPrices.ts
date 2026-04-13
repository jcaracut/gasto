import { AssetPrice, PriceHistory } from "@/types/expense";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

/**
 * Default asset prices in PHP (cached fallback for offline mode)
 * Last updated: April 2026
 */
const DEFAULT_PRICES: Record<string, AssetPrice> = {
  BTC: {
    id: "BTC",
    symbol: "BTC",
    name: "Bitcoin",
    price: 2_650_000, // ₱
    previousPrice: 2_620_000,
    change: 1.14,
    timestamp: new Date().toISOString(),
    source: "cache",
  },
  GOLD: {
    id: "GOLD",
    symbol: "GOLD",
    name: "Gold (per gram)",
    price: 3_200, // ₱ per gram
    previousPrice: 3_180,
    change: 0.63,
    timestamp: new Date().toISOString(),
    source: "cache",
  },
  USD: {
    id: "USD",
    symbol: "USD",
    name: "US Dollar",
    price: 60.18, // ₱ per USD
    previousPrice: 60.08,
    change: 0.44,
    timestamp: new Date().toISOString(),
    source: "cache",
  },
};

interface AssetPricesState {
  prices: Record<string, AssetPrice>;
  priceHistory: Record<string, PriceHistory>;
  loading: boolean;
  lastSync: string | null;
  isOnline: boolean;
}

export function useAssetPrices() {
  const [state, setState] = useState<AssetPricesState>({
    prices: DEFAULT_PRICES,
    priceHistory: {},
    loading: false,
    lastSync: null,
    isOnline: false,
  });

  // Initialize: Load cached prices on mount
  useEffect(() => {
    const initializePrices = async () => {
      try {
        const cachedPrices = await AsyncStorage.getItem("@gasto_asset_prices");
        const cachedHistory = await AsyncStorage.getItem(
          "@gasto_price_history",
        );
        const cachedLastSync = await AsyncStorage.getItem(
          "@gasto_last_price_sync",
        );

        if (cachedPrices) {
          const parsed = JSON.parse(cachedPrices);
          setState((prev) => ({
            ...prev,
            prices: { ...DEFAULT_PRICES, ...parsed },
          }));
        }

        if (cachedHistory) {
          setState((prev) => ({
            ...prev,
            priceHistory: JSON.parse(cachedHistory),
          }));
        }

        if (cachedLastSync) {
          setState((prev) => ({
            ...prev,
            lastSync: cachedLastSync,
          }));
        }
      } catch (error) {
        console.error("Failed to load cached asset prices:", error);
        // Continue with defaults
      }
    };

    initializePrices();
  }, []);

  /**
   * Fetch current prices from public APIs (only when internet available)
   * This is called opportunistically and should not block anything
   * @param assetsToSync Optional array of assets to sync. Defaults to all assets ["BTC", "GOLD", "USD"]
   */
  const syncPrices = useCallback(
    async (assetsToSync?: ("BTC" | "GOLD" | "USD")[]) => {
      const targetAssets = assetsToSync || ["BTC", "GOLD", "USD"];

      // Throttle: Prevent fetching more than once every 5 minutes
      const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
      if (state.lastSync) {
        const now = Date.now();
        const lastSyncTime = new Date(state.lastSync).getTime();
        const timeSinceLastSync = now - lastSyncTime;

        if (timeSinceLastSync < SYNC_INTERVAL) {
          const timeRemaining = Math.round(
            (SYNC_INTERVAL - timeSinceLastSync) / 1000,
          );
          console.log(
            `Price sync throttled - next sync available in ${timeRemaining}s (last sync was ${Math.round(timeSinceLastSync / 1000)}s ago)`,
          );
          return;
        }
      }

      setState((prev) => ({ ...prev, loading: true }));

      try {
        const updatedPrices: Record<string, AssetPrice> = { ...state.prices };

        // Fetch Bitcoin price if requested
        if (targetAssets.includes("BTC")) {
          const btcResponse = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=php&include_24hr_change=true",
          );

          if (btcResponse.ok) {
            const btcData = await btcResponse.json();
            const btcPrice = btcData.bitcoin?.php || state.prices.BTC.price;
            const btcChange = btcData.bitcoin?.php_24h_change || 0;

            updatedPrices.BTC = {
              ...state.prices.BTC,
              previousPrice: state.prices.BTC.price,
              price: Math.round(btcPrice),
              change: Math.round(btcChange * 100) / 100,
              timestamp: new Date().toISOString(),
              source: "api",
            };
          }
        }

        // Gold price: Mock API response (in production, use a paid API)
        if (targetAssets.includes("GOLD")) {
          const goldChange = Math.random() * 2 - 1; // Random -1 to +1%
          updatedPrices.GOLD = {
            ...state.prices.GOLD,
            previousPrice: state.prices.GOLD.price,
            price: Math.round(state.prices.GOLD.price * (1 + goldChange / 100)),
            change: Math.round(goldChange * 100) / 100,
            timestamp: new Date().toISOString(),
            source: "api",
          };
        }

        // Fetch USD to PHP conversion rate from exchangerate.host (free, no API key required)
        if (targetAssets.includes("USD")) {
          const usdResponse = await fetch(
            "https://api.exchangerate.host/latest?base=USD&symbols=PHP",
          );

          if (usdResponse.ok) {
            const usdData = await usdResponse.json();
            if (usdData.success && usdData.rates?.PHP) {
              const usdRate = usdData.rates.PHP;
              // Calculate change from previous price
              const usdChange =
                Math.round(
                  ((usdRate - state.prices.USD.price) /
                    state.prices.USD.price) *
                    10000,
                ) / 100;

              updatedPrices.USD = {
                ...state.prices.USD,
                previousPrice: state.prices.USD.price,
                price: Math.round(usdRate * 100) / 100, // Round to 2 decimals for PHP
                change: usdChange,
                timestamp: new Date().toISOString(),
                source: "api",
              };
            }
          }
        }

        // Update price history
        const newHistory: Record<string, PriceHistory> = {
          ...state.priceHistory,
        };
        for (const [symbol, price] of Object.entries(updatedPrices)) {
          if (!newHistory[symbol]) {
            newHistory[symbol] = {
              symbol,
              priceHistory: [],
              lastFetched: new Date().toISOString(),
            };
          }
          newHistory[symbol].priceHistory.push({
            date: new Date().toISOString(),
            price: price.price,
          });
          // Keep only last 90 days of history
          if (newHistory[symbol].priceHistory.length > 90) {
            newHistory[symbol].priceHistory.shift();
          }
          newHistory[symbol].lastFetched = new Date().toISOString();
        }

        // Save to AsyncStorage
        await AsyncStorage.setItem(
          "@gasto_asset_prices",
          JSON.stringify(updatedPrices),
        );
        await AsyncStorage.setItem(
          "@gasto_price_history",
          JSON.stringify(newHistory),
        );
        await AsyncStorage.setItem(
          "@gasto_last_price_sync",
          new Date().toISOString(),
        );

        setState((prev) => ({
          ...prev,
          prices: updatedPrices,
          priceHistory: newHistory,
          lastSync: new Date().toISOString(),
          loading: false,
          isOnline: true,
        }));
      } catch (error) {
        console.warn("Failed to fetch asset prices (using cached):", error);
        setState((prev) => ({
          ...prev,
          loading: false,
          isOnline: false,
        }));
      }
    },
    [state.prices, state.priceHistory, state.lastSync],
  );

  /**
   * Get current price of a specific asset
   */
  const getPrice = useCallback(
    (symbol: "BTC" | "GOLD" | "USD"): AssetPrice | null => {
      return state.prices[symbol] || null;
    },
    [state.prices],
  );

  /**
   * Get price change for an asset
   */
  const getPriceChange = useCallback(
    (symbol: "BTC" | "GOLD" | "USD"): number => {
      return state.prices[symbol]?.change || 0;
    },
    [state.prices],
  );

  /**
   * Get price history for chart visualization
   */
  const getPriceHistory = useCallback(
    (symbol: "BTC" | "GOLD" | "USD"): PriceHistory | null => {
      return state.priceHistory[symbol] || null;
    },
    [state.priceHistory],
  );

  /**
   * Convert peso amount to equivalent asset amount
   */
  const convertPesoToAsset = useCallback(
    (pesoAmount: number, asset: "BTC" | "GOLD" | "USD"): number => {
      const price = state.prices[asset];
      if (!price) return 0;

      if (asset === "BTC") {
        return pesoAmount / price.price; // Returns BTC amount
      } else if (asset === "GOLD") {
        return pesoAmount / price.price; // Returns grams of gold
      } else if (asset === "USD") {
        return pesoAmount / price.price; // Returns USD amount
      }
      return 0;
    },
    [state.prices],
  );

  /**
   * Convert asset amount back to peso equivalent
   */
  const convertAssetToPeso = useCallback(
    (assetAmount: number, asset: "BTC" | "GOLD" | "USD"): number => {
      const price = state.prices[asset];
      if (!price) return 0;
      return assetAmount * price.price;
    },
    [state.prices],
  );

  return {
    // State
    prices: state.prices,
    priceHistory: state.priceHistory,
    loading: state.loading,
    lastSync: state.lastSync,
    isOnline: state.isOnline,

    // Methods
    syncPrices,
    getPrice,
    getPriceChange,
    getPriceHistory,
    convertPesoToAsset,
    convertAssetToPeso,
  };
}
