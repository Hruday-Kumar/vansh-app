/**
 * 🪷 VANSH TYPE SYSTEM
 * Complete TypeScript definitions for the Digital Heirloom Platform
 */

// Core domain types
export * from './core';

// Database schema types
export * from './database';

// API request/response types
export * from './api';

// Re-export commonly used types for convenience
export type {
    DigitalEcho,

    // Supporting types
    Era, FamilyId, GeoLocation, Katha, KathaId, MemberId,
    MemoryId, Parampara, PranaConnection, Relationship,
    // Core entities
    SmritiMedia, TimeRiverItem,
    // IDs
    VanshId, Vasiyat, VasiyatId, VrikshaMember, WisdomFragment
} from './core';

