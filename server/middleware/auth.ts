import { verifyAndStoreUser } from '../utils/auth';

export default defineEventHandler(async (event) => {
  const publicPaths = ['/api/public', '/_nuxt', '/favicon.ico'];
  
  if (publicPaths.some(path => event.path.startsWith(path))) {
    return;
  }
  
  console.log('[Middleware] Processing path:', event.path);
  const user = await verifyAndStoreUser(event);
  
  if (user) {
    event.context.user = user;
    console.log('[Middleware] User authenticated:', user.userId);
  } else {
    console.log('[Middleware] No user authenticated for:', event.path);
  }
});
