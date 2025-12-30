import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { H3Event } from 'h3';
import { sql } from './db';

export async function verifyAndStoreUser(event: H3Event) {
  const headers = getRequestHeaders(event);
  const authHeader = headers['authorization'] || headers['Authorization'];
  
  if (!authHeader?.startsWith('Bearer ')) {
    console.log('[Auth] No Bearer token found');
    return null;
  }
  
  const token = authHeader.slice('Bearer '.length);
  console.log('[Auth] Token received:', token.substring(0, 20) + '...');
  
  try {
    const { CLERK_JWT_ISSUER } = useRuntimeConfig();
    console.log('[Auth] CLERK_JWT_ISSUER:', CLERK_JWT_ISSUER);
    
    if (!CLERK_JWT_ISSUER) {
      console.error('[Auth] CLERK_JWT_ISSUER not configured!');
      return null;
    }
    
    const jwks = createRemoteJWKSet(new URL(`${CLERK_JWT_ISSUER}/.well-known/jwks.json`));
    const { payload } = await jwtVerify(token, jwks, { issuer: CLERK_JWT_ISSUER });
    
    const userId = payload.sub as string;
    const email = (payload.email as string) || null;
    console.log('[Auth] JWT verified. User ID:', userId, 'Email:', email);
    
    const db = sql();
    await db`
      INSERT INTO public.users (id, email)
      VALUES (${userId}, ${email})
      ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
    `;
    console.log('[Auth] User stored/updated in database');
    
    return { userId, email };
  } catch (error) {
    console.error('[Auth] JWT verification failed:', error);
    return null;
  }
}

export function requireAuth(event: H3Event): { userId: string; email: string | null } {
  const user = event.context.user as { userId: string; email: string | null } | undefined;
  
  if (!user) {
    throw createError({ 
      status: 401, 
      statusText: 'Unauthorized' 
    });
  }
  
  return user;
}
