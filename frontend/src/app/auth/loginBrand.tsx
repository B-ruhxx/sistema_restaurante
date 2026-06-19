import React from 'react';
import { useConfigStore } from '../../store/configStore';
import { ChefHat } from 'lucide-react';

export const LoginBrand = () => {
  const { name, logoUrl } = useConfigStore();
  return (
    <div className="flex flex-col items-center gap-4 mb-6">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt="logo"
          className="w-16 h-16 rounded-xl object-cover shadow-sm border border-[#c5d8fc] dark:border-blue-900"
        />
      ) : (
        <div className="w-16 h-16 bg-[#e8f0fe] dark:bg-blue-950 rounded-xl flex items-center justify-center shadow-sm border border-[#c5d8fc] dark:border-blue-900">
          <ChefHat className="w-6 h-6 text-[#4f7bf7] dark:text-blue-400" />
        </div>
      )}
      <h1 className="text-3xl font-bold">{name || 'RestaurantERP'}</h1>
      <p className="text-muted-foreground text-center">
        Sistema de Gestión Integral para Restaurantes
      </p>
    </div>
  );
};
