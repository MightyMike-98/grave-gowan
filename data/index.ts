/**
 * @file data/index.ts
 * @description Öffentliche API des data/-Pakets.
 *
 * Nur diese Exports dürfen von der UI-Schicht (app/) verwendet werden.
 * Der Supabase-Client selbst ist NICHT re-exportiert — er ist intern.
 */

// Repositories
export { SupabaseMemberRepository } from './src/repositories/SupabaseMemberRepository';
export { SupabaseMemorialRepository } from './src/repositories/SupabaseMemorialRepository';
export { SupabaseMemoryRepository } from './src/repositories/SupabaseMemoryRepository';

// Auth-Funktionen
export { getCurrentUser, signInWithGoogle, signInWithMagicLink, signOut } from './src/auth';

// Server-Client (für Server Components und Route Handlers)
export { createSupabaseServerClient } from './src/server-client';

// Browser-Client (für Client Components)
export { createSupabaseBrowserClient } from './src/browser-client';

// Storage (Bild-Upload)
export { uploadMemorialImage } from './src/storage';



