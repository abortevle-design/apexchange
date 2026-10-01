import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// Convenience hook to consume the demo auth state across the app.
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
