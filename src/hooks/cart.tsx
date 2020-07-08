import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

async function updateAsyncStorage(cartState: Product[]): Promise<void> {
  await AsyncStorage.setItem(
    '@gostack-marketplace/cartState',
    JSON.stringify(cartState),
  );
}

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const previousCartState = await AsyncStorage.getItem(
        '@gostack-marketplace/cartState',
      );
      if (!previousCartState) return;
      const parsedPreviousCartState = JSON.parse(
        previousCartState,
      ) as Product[];
      setProducts(parsedPreviousCartState);
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async (product: Product) => {
      const newProducts = [...products];
      const productInCart = newProducts.find(p => p.id === product.id);
      if (productInCart) {
        productInCart.quantity += 1;
      } else {
        const newProduct = product;
        newProduct.quantity = 1;
        newProducts.push(newProduct);
      }
      setProducts(newProducts);
      await updateAsyncStorage(newProducts);
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const newProducts = [...products];
      const productInCart = newProducts.find(c => c.id === id);
      if (!productInCart) return;
      productInCart.quantity += 1;
      setProducts(newProducts);
      await updateAsyncStorage(newProducts);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      let newProducts = [...products];
      const productInCart = newProducts.find(c => c.id === id);
      if (!productInCart) return;
      productInCart.quantity -= 1;
      if (productInCart.quantity === 0) {
        newProducts = newProducts.filter(p => p.id !== id);
      }
      setProducts(newProducts);
      await updateAsyncStorage(newProducts);
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
