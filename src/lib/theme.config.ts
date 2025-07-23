import { Theme } from '@rainbow-me/rainbowkit';

export const getCustomTheme = (isDark: boolean): Theme => {
  const baseTheme = isDark ? darkTheme() : lightTheme();
  
  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      // Primary colors
      accentColor: isDark ? '#8b5cf6' : '#7c3aed', // Purple shade
      accentColorForeground: '#ffffff',
      
      // Button styles
      actionButtonBorder: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      actionButtonBorderMobile: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      actionButtonSecondaryBackground: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
      
      // Connect button
      connectButtonBackground: isDark ? '#1f2937' : '#f3f4f6',
      connectButtonBackgroundError: isDark ? '#991b1b' : '#fef2f2',
      connectButtonInnerBackground: 'transparent',
      connectButtonText: isDark ? '#ffffff' : '#111827',
      connectButtonTextError: isDark ? '#fecaca' : '#b91c1c',
      
      // Modal and overlays
      modalBackground: isDark ? '#111827' : '#ffffff',
      modalBackdrop: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.4)',
      modalBorder: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      modalText: isDark ? '#f3f4f6' : '#111827',
      modalTextDim: isDark ? '#9ca3af' : '#6b7280',
      modalTextSecondary: isDark ? '#9ca3af' : '#4b5563',
      
      // UI Elements
      closeButton: isDark ? '#9ca3af' : '#6b7280',
      closeButtonBackground: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      connectionIndicator: isDark ? '#10b981' : '#059669',
      error: isDark ? '#f87171' : '#dc2626',
      generalBorder: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      generalBorderDim: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
      menuItemBackground: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
      profileAction: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      profileActionHover: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
      profileForeground: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
      selectedOptionBorder: isDark ? 'rgba(124, 58, 237, 0.5)' : 'rgba(124, 58, 237, 0.3)',
      standby: isDark ? '#9ca3af' : '#6b7280',
      
      // Gradients
      downloadBottomCardBackground: isDark 
        ? 'linear-gradient(126deg, #1f2937 0%, #111827 100%)' 
        : 'linear-gradient(126deg, #f9fafb 0%, #f3f4f6 100%)',
      downloadTopCardBackground: isDark 
        ? 'linear-gradient(166deg, #1f2937 0%, #111827 100%)' 
        : 'linear-gradient(166deg, #f9fafb 0%, #f3f4f6 100%)',
    },
    
    // Typography
    fonts: {
      body: 'Inter, -apple-system, system-ui, sans-serif',
    },
    
    // Border radius
    radii: {
      actionButton: '0.5rem',
      connectButton: '0.75rem',
      menuButton: '0.75rem',
      modal: '1rem',
      modalMobile: '1rem',
    },
    
    // Shadows and effects
    shadows: {
      connectButton: '0 4px 12px 0 rgba(0, 0, 0, 0.1)',
      dialog: isDark 
        ? '0 8px 32px rgba(0, 0, 0, 0.5)' 
        : '0 8px 32px rgba(0, 0, 0, 0.1)',
      profileDetailsAction: '0 0 0 1px',
      selectedOption: '0 0 0 1px',
      selectedWallet: '0 0 0 1px',
      walletLogo: '0 2px 8px 0 rgba(0, 0, 0, 0.2)',
    },
    
    // Blur effects
    blurs: {
      modalOverlay: 'blur(8px)',
    },
    

  };
};

// We need to import these from rainbowkit here to avoid circular dependencies
import { darkTheme as darkThemeImport, lightTheme as lightThemeImport } from '@rainbow-me/rainbowkit';

// Create local instances of the theme functions to avoid circular imports
const darkTheme = darkThemeImport;
const lightTheme = lightThemeImport;
