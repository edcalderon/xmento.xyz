declare module '@composer-kit/ui' {
  import { FC, ReactNode } from 'react';
  
  export interface IdentityProps {
    address?: string;
    token?: string;
    className?: string;
    children?: ReactNode;
  }

  export const Identity: FC<IdentityProps>;
  export const Avatar: FC<{ address: string; className?: string }>;
  export const Balance: FC<{ address: string; token: string; className?: string }>;
  export const Name: FC<{ address: string; className?: string }>;
  export const Social: FC<{ address: string; className?: string }>;
}
