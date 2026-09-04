import { RouterProvider } from 'react-router-dom';
import { AppProvider } from '@/app/providers/AppProvider';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { ConfigErrorBoundary } from '@/components/ConfigErrorBoundary';
import { router } from '@/app/router';
import { loadAppConfig } from '@/infrastructure/config/appConfig';

const config = loadAppConfig();

export default function App() {
  return (
    <ConfigErrorBoundary>
      <AppProvider config={config}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </AppProvider>
    </ConfigErrorBoundary>
  );
}
