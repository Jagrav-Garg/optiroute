import React from 'react';
import { TripProvider } from './context/TripContext';
import { AppShell } from './components/layout/AppShell';

export function App() {
  return (
    <TripProvider>
      <AppShell />
    </TripProvider>
  );
}

export default App;
