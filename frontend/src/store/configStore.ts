import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface ConfigState {
  name: string;
  logoUrl: string;
  setConfig: (data: { name: string; logoUrl: string }) => void;
}

export const useConfigStore = create<ConfigState>()(
  devtools(set => ({
    name: '',
    logoUrl: '',
    setConfig: data => set(state => ({ ...state, ...data })),
  }))
);
