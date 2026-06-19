import { ThemeProvider } from 'next-themes';
import { AuthProvider } from './contexts/AuthContext';
import { ERPProvider } from './contexts/ERPContext';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <AuthProvider>
          <ERPProvider>
            <RouterProvider router={router} />
            <Toaster />
          </ERPProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
