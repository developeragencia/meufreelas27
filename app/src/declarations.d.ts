/// <reference types="vite/client" />

declare module 'react-google-recaptcha' {
    import * as React from 'react';
  
    export interface ReCAPTCHAProps {
      sitekey: string;
      onChange?: (token: string | null) => void;
      onExpired?: () => void;
      onErrored?: () => void;
      theme?: 'light' | 'dark';
      size?: 'compact' | 'normal' | 'invisible';
      tabindex?: number;
      hl?: string;
      badge?: 'bottomright' | 'bottomleft' | 'inline';
      className?: string;
      style?: React.CSSProperties;
    }
  
    export default class ReCAPTCHA extends React.Component<ReCAPTCHAProps> {
      reset(): void;
      execute(): void;
      getValue(): string | null;
      getWidgetId(): number | null;
    }
}
