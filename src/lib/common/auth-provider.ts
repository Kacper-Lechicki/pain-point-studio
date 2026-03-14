import { z } from 'zod';

export const AUTH_PROVIDERS = ['google', 'github'] as const;

export type AuthProvider = (typeof AUTH_PROVIDERS)[number];

export const authProviderSchema = z.enum(AUTH_PROVIDERS);
