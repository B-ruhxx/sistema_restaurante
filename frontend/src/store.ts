import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Caja, Producto, ComboProducto, VarianteProducto } from './types'

export interface CartItem {
  producto?: Producto;
  combo?: ComboProducto;
  variante?: VarianteProducto;
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
    avatarUrl?: string | null;
    avatar_url?: string | null;
  } | null;
  caja: Caja | null;
  cart: CartItem[];
  companyName: string | null;
  companyLogo: string | null;
  
  // Actions
  login: (token: string, user: AppState['user']) => void;
  logout: () => void;
  setCaja: (caja: Caja | null) => void;
  setCompanyInfo: (name: string, logo: string | null) => void;
  updateUser: (user: Partial<NonNullable<AppState['user']>>) => void;
  
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
      companyName: null,
      companyLogo: null,

      login: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null, caja: null, cart: [] }),
      setCaja: (caja) => set({ caja }),
      setCompanyInfo: (name, logo) => set({ companyName: name, companyLogo: logo }),
      updateUser: (user) => set((state) => ({
        user: state.user ? { ...state.user, ...user } : null
      })),

      addToCart: (item) => set((state) => {
        const existingIndex = state.cart.findIndex(
          (i) => 
            (i.producto?.idProducto === item.producto?.idProducto && 
             i.combo?.idCombo === item.combo?.idCombo &&
             i.observacion === item.observacion &&
             i.variante?.idVariante === item.variante?.idVariante)
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
        companyName: state.companyName,
        companyLogo: state.companyLogo,
      } as any),
    }
  )
)
