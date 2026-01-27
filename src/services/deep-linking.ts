/**
 * 🪷 VANSH DEEP LINKING SERVICE
 * Handle vanshapp:// URLs and universal links for sharing content
 * 
 * URL Scheme: vanshapp://
 * Universal Link: https://vansh.app/
 * 
 * Routes:
 * - vanshapp://member/{id}     - Open member profile
 * - vanshapp://memory/{id}     - Open memory viewer
 * - vanshapp://katha/{id}      - Open katha player
 * - vanshapp://tradition/{id}  - Open tradition detail
 * - vanshapp://invite/{code}   - Accept family invite
 * - vanshapp://share/{type}/{id} - Generic share handler
 */

import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { Platform, Share } from 'react-native';

// ============================================================================
// TYPES
// ============================================================================

export type DeepLinkType = 'member' | 'memory' | 'katha' | 'tradition' | 'vasiyat' | 'invite';

export interface DeepLinkParams {
  type: DeepLinkType;
  id: string;
  data?: Record<string, string>;
}

export interface ShareableContent {
  type: DeepLinkType;
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export const DEEP_LINK_CONFIG = {
  scheme: 'vanshapp',
  universalDomain: 'vansh.app',
  prefixes: [
    'vanshapp://',
    'https://vansh.app',
    'https://www.vansh.app',
  ],
} as const;

// Route mapping for deep links
const ROUTE_MAP: Record<DeepLinkType, string> = {
  member: '/(tabs)/vriksha/member',
  memory: '/(tabs)/smriti/viewer',
  katha: '/(tabs)/katha/player',
  tradition: '/(tabs)/parampara/detail',
  vasiyat: '/(tabs)/vasiyat/viewer',
  invite: '/invite',
};

// ============================================================================
// URL GENERATION
// ============================================================================

/**
 * Generate a deep link URL for content
 */
export function generateDeepLink(params: DeepLinkParams): string {
  const baseUrl = Linking.createURL(`${params.type}/${params.id}`, {
    scheme: DEEP_LINK_CONFIG.scheme,
  });
  
  // Add any additional query params
  if (params.data) {
    const queryString = new URLSearchParams(params.data).toString();
    return `${baseUrl}?${queryString}`;
  }
  
  return baseUrl;
}

/**
 * Generate a universal link URL for web sharing
 */
export function generateUniversalLink(params: DeepLinkParams): string {
  const base = `https://${DEEP_LINK_CONFIG.universalDomain}`;
  const path = `/${params.type}/${params.id}`;
  
  if (params.data) {
    const queryString = new URLSearchParams(params.data).toString();
    return `${base}${path}?${queryString}`;
  }
  
  return `${base}${path}`;
}

// ============================================================================
// URL PARSING
// ============================================================================

/**
 * Parse a deep link URL into params
 */
export function parseDeepLink(url: string): DeepLinkParams | null {
  try {
    const parsed = Linking.parse(url);
    const { path, queryParams } = parsed;
    
    if (!path) return null;
    
    // Parse path: /type/id or type/id
    const pathParts = path.replace(/^\//, '').split('/');
    
    if (pathParts.length < 2) return null;
    
    const [type, id] = pathParts;
    
    // Validate type
    if (!isValidDeepLinkType(type)) return null;
    
    return {
      type: type as DeepLinkType,
      id,
      data: queryParams as Record<string, string>,
    };
  } catch (error) {
    console.error('[DeepLink] Failed to parse URL:', error);
    return null;
  }
}

/**
 * Check if a string is a valid deep link type
 */
function isValidDeepLinkType(type: string): type is DeepLinkType {
  return ['member', 'memory', 'katha', 'tradition', 'vasiyat', 'invite'].includes(type);
}

// ============================================================================
// NAVIGATION
// ============================================================================

/**
 * Navigate to a deep link destination
 */
export function navigateToDeepLink(params: DeepLinkParams): void {
  const route = ROUTE_MAP[params.type];
  
  if (!route) {
    console.warn('[DeepLink] Unknown type:', params.type);
    return;
  }
  
  // Build route with params
  const routeWithParams = `${route}?id=${params.id}`;
  
  // Add any additional params
  if (params.data) {
    const additionalParams = Object.entries(params.data)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    
    router.push(`${routeWithParams}&${additionalParams}` as any);
  } else {
    router.push(routeWithParams as any);
  }
}

/**
 * Handle an incoming deep link URL
 */
export async function handleDeepLink(url: string): Promise<boolean> {
  console.log('[DeepLink] Handling URL:', url);
  
  const params = parseDeepLink(url);
  
  if (!params) {
    console.warn('[DeepLink] Could not parse URL:', url);
    return false;
  }
  
  // Handle special cases
  if (params.type === 'invite') {
    return handleInviteLink(params.id, params.data);
  }
  
  navigateToDeepLink(params);
  return true;
}

/**
 * Handle family invite links
 */
async function handleInviteLink(code: string, data?: Record<string, string>): Promise<boolean> {
  console.log('[DeepLink] Processing invite code:', code);
  
  // TODO: Implement invite handling
  // 1. Validate invite code with API
  // 2. If valid, navigate to accept invite screen
  // 3. If invalid, show error
  
  router.push(`/invite?code=${code}` as any);
  return true;
}

// ============================================================================
// SHARING
// ============================================================================

/**
 * Share content with deep link
 */
export async function shareContent(content: ShareableContent): Promise<boolean> {
  const deepLink = generateDeepLink({
    type: content.type,
    id: content.id,
  });
  
  const universalLink = generateUniversalLink({
    type: content.type,
    id: content.id,
  });
  
  // Construct share message
  const message = buildShareMessage(content, universalLink);
  
  try {
    const result = await Share.share(
      Platform.select({
        ios: {
          message: content.title,
          url: universalLink,
        },
        default: {
          message,
        },
      }),
      {
        dialogTitle: `Share ${content.title}`,
      }
    );
    
    return result.action === Share.sharedAction;
  } catch (error) {
    console.error('[DeepLink] Share failed:', error);
    return false;
  }
}

/**
 * Build a share message for content
 */
function buildShareMessage(content: ShareableContent, link: string): string {
  let message = `🪷 ${content.title}`;
  
  if (content.subtitle) {
    message += `\n${content.subtitle}`;
  }
  
  message += `\n\nView in Vansh: ${link}`;
  
  return message;
}

/**
 * Share a family member profile
 */
export async function shareMember(member: {
  id: string;
  name: string;
  relation?: string;
}): Promise<boolean> {
  return shareContent({
    type: 'member',
    id: member.id,
    title: member.name,
    subtitle: member.relation,
  });
}

/**
 * Share a memory
 */
export async function shareMemory(memory: {
  id: string;
  title: string;
  date?: string;
}): Promise<boolean> {
  return shareContent({
    type: 'memory',
    id: memory.id,
    title: memory.title,
    subtitle: memory.date,
  });
}

/**
 * Share a katha
 */
export async function shareKatha(katha: {
  id: string;
  title: string;
  narrator?: string;
}): Promise<boolean> {
  return shareContent({
    type: 'katha',
    id: katha.id,
    title: katha.title,
    subtitle: katha.narrator ? `Narrated by ${katha.narrator}` : undefined,
  });
}

/**
 * Share a tradition
 */
export async function shareTradition(tradition: {
  id: string;
  name: string;
  description?: string;
}): Promise<boolean> {
  return shareContent({
    type: 'tradition',
    id: tradition.id,
    title: tradition.name,
    subtitle: tradition.description,
  });
}

// ============================================================================
// INVITE LINKS
// ============================================================================

/**
 * Generate a family invite link
 */
export function generateInviteLink(inviteCode: string, familyName?: string): string {
  return generateUniversalLink({
    type: 'invite',
    id: inviteCode,
    data: familyName ? { family: familyName } : undefined,
  });
}

// ============================================================================
// INITIALIZATION
// ============================================================================

let isInitialized = false;

/**
 * Initialize deep link handling
 * Call this in your app's root layout
 */
export async function initializeDeepLinks(
  onLink?: (params: DeepLinkParams) => void
): Promise<void> {
  if (isInitialized) {
    console.warn('[DeepLink] Already initialized');
    return;
  }
  
  isInitialized = true;
  
  // Handle initial URL (app opened via deep link)
  const initialUrl = await Linking.getInitialURL();
  if (initialUrl) {
    console.log('[DeepLink] Initial URL:', initialUrl);
    const params = parseDeepLink(initialUrl);
    if (params) {
      onLink?.(params);
      navigateToDeepLink(params);
    }
  }
  
  // Listen for incoming links while app is open
  Linking.addEventListener('url', (event) => {
    console.log('[DeepLink] Incoming URL:', event.url);
    const params = parseDeepLink(event.url);
    if (params) {
      onLink?.(params);
      navigateToDeepLink(params);
    }
  });
}

export default {
  generateDeepLink,
  generateUniversalLink,
  parseDeepLink,
  handleDeepLink,
  shareContent,
  shareMember,
  shareMemory,
  shareKatha,
  shareTradition,
  generateInviteLink,
  initializeDeepLinks,
  DEEP_LINK_CONFIG,
};
