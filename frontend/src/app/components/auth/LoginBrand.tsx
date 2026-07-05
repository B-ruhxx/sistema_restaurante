import { Store } from 'lucide-react';
import { useConfigStore } from '../../../store/configStore';
import { getFullImageUrl } from '../ui/utils';

export function LoginBrand() {
    const { name, logoUrl } = useConfigStore();

    return (
        <div className="flex flex-col items-center text-center mb-6">
            {logoUrl ? (
                <img
                    src={getFullImageUrl(logoUrl)}
                    alt="Logo"
                    className="h-16 w-16 rounded-2xl object-cover shadow-sm"
                />
            ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--action-primary)] shadow-ui-medium">
                    <Store className="h-8 w-8 text-[var(--text-inverse)]" />
                </div>
            )}

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
                {name || 'RestaurantePOS'}
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
                Sistema de gestión para restaurantes
            </p>
        </div>
    );
}
