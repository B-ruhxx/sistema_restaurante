import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Caja, Producto, ComboProducto } from './types'

export interface CartItem {
  producto?: Producto;
  combo?: ComboProducto;
  cantidad: number;
  precioUnitario: number;
  observacion?: string;
  cartId: string; 
}

interface AppState {
  token: string | null;
  user: {
    idEmpleado: number;
    nombre: string;
    apellido: string;
    username: string;
    rol: string;
  } | null;
  caja: Caja | null;
  cart: CartItem[];
  
  // Actions
  login: (token: string, user: AppState['user']) => void;
  logout: () => void;
  setCaja: (caja: Caja | null) => void;
  
  // Cart Actions
  addToCart: (item: Omit<CartItem, 'cartId'>) => void;
  removeFromCart: (cartId: string) => void;
  updateCartQty: (cartId: string, qty: number) => void;
  updateCartObservacion: (cartId: string, obs: string) => void;
  clearCart: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      caja: null,
      cart: [],

      login: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null, caja: null, cart: [] }),
      setCaja: (caja) => set({ caja }),

      addToCart: (item) => set((state) => {
        const existingIndex = state.cart.findIndex(
          (i) => 
            (i.producto?.idProducto === item.producto?.idProducto && 
             i.combo?.idCombo === item.combo?.idCombo &&
             i.observacion === item.observacion)
        );

        if (existingIndex > -1) {
          const newCart = [...state.cart];
          newCart[existingIndex].cantidad += item.cantidad;
          return { cart: newCart };
        }

        const cartId = Math.random().toString(36).substring(2, 9);
        return { cart: [...state.cart, { ...item, cartId }] };
      }),

      removeFromCart: (cartId) => set((state) => ({
        cart: state.cart.filter((item) => item.cartId !== cartId)
      })),

      updateCartQty: (cartId, qty) => set((state) => ({
        cart: state.cart.map((item) => 
          item.cartId === cartId ? { ...item, cantidad: Math.max(1, qty) } : item
        )
      })),

      updateCartObservacion: (cartId, obs) => set((state) => ({
        cart: state.cart.map((item) => 
          item.cartId === cartId ? { ...item, observacion: obs } : item
        )
      })),

      clearCart: () => set({ cart: [] }),
    }),
    {
      name: 'restaurante-store',
      // persist only authentication and active register session, cart can be in memory
      storage: {
        getItem: (name) => {
          const val = localStorage.getItem(name);
          return val ? JSON.parse(val) : null;
        },
        setItem: (name, value) => localStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => localStorage.removeItem(name),
      },
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        caja: state.caja,
      } as any),
    }
  )
)
