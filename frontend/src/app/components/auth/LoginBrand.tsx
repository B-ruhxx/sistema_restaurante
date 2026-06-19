import { Store } from 'lucide-react';
import { useConfigStore } from '../../../store/configStore';

export function LoginBrand() {
    const { name, logoUrl } = useConfigStore();

    return (
        <div className="flex flex-col items-center text-center mb-6">
            {logoUrl ? (
                <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-16 w-16 rounded-2xl object-cover shadow-sm"
                />
            ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-600 shadow-md shadow-red-600/10">
                    <Store className="h-8 w-8 text-white" />
                </div>
            )}

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900">
                {name || 'RestaurantePOS'}
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
                Sistema de gestión para restaurantes
            </p>
        </div>
    );
}