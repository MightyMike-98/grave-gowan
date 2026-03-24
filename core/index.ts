/**
 * @file core/index.ts
 * @description Öffentliche API des Core-Pakets.
 *
 * Alle Exporte, die von der UI-Schicht (app/) oder dem data/-Layer
 * aus @core importiert werden dürfen, müssen hier re-exportiert sein.
 * Kein direktes Importieren aus Unterordnern (z. B. @core/src/types).
 */

// Domain-Typen
export type { GalleryPhoto, Member, Memorial, Memory } from './src/types/index';
export type { CreateGalleryPhotoInput, CreateMemorialInput, CreateMemoryInput, UpdateMemorialInput } from './src/types/inputs';

// Repository-Interfaces (werden von data/ implementiert)
export type { MemberRepository } from './src/repositories/MemberRepository';
export type { MemorialRepository } from './src/repositories/MemorialRepository';
export type { MemoryRepository } from './src/repositories/MemoryRepository';
export type { PhotoRepository } from './src/repositories/PhotoRepository';

// Use Cases (werden von app/ aufgerufen)
export { addGalleryPhoto } from './src/use-cases/addGalleryPhoto';
export { addMemory } from './src/use-cases/addMemory';
export { createMemorial, generateSlug } from './src/use-cases/createMemorial';
export { deleteGalleryPhoto } from './src/use-cases/deleteGalleryPhoto';
export { getGalleryPhotos } from './src/use-cases/getGalleryPhotos';
export { getMemorialBySlug } from './src/use-cases/getMemorialBySlug';
export { getMemorialsByOwner } from './src/use-cases/getMemorialsByOwner';
export { inviteMember } from './src/use-cases/inviteMember';
export { removeMember } from './src/use-cases/removeMember';
export { togglePhotoFavorite } from './src/use-cases/togglePhotoFavorite';
export { updateMemorial } from './src/use-cases/updateMemorial';

