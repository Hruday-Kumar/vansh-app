/**
 * 🪷 VANSH API CLIENT
 * Central API service with all endpoints
 */

import { API_URL } from '../config/api';
import type {
  AddRelationshipRequest,
  ApiResponse,
  ChatWithEchoRequest, ChatWithEchoResponse,
  CheckVasiyatUnlockRequest, CheckVasiyatUnlockResponse,
  CreateMemberRequest,
  CreateVasiyatRequest, CreateVasiyatResponse,
  FamilyId,
  GetAncestryRequest, GetAncestryResponse,
  GetFamilyTreeRequest, GetFamilyTreeResponse,
  GetHeritageMapRequest, GetHeritageMapResponse,
  GetMemoriesRequest, GetMemoriesResponse,
  GetNudgeRequest, GetNudgeResponse,
  GetTimeRiverRequest, GetTimeRiverResponse,
  GetVasiyatContentRequest, GetVasiyatContentResponse,
  LoginRequest, LoginResponse,
  MemberId,
  RecordKathaRequest, RecordKathaResponse,
  UploadMemoryRequest, UploadMemoryResponse,
  VoicePhotoStitchRequest, VoicePhotoStitchResponse,
  VrikshaMember,
} from '../types';

// ═══════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════

class VanshApiClient {
  private token: string | null = null;
  
  setToken(token: string | null) {
    this.token = token;
  }
  
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };
    
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.code || 'UNKNOWN_ERROR',
            message: data.message || 'An error occurred',
            details: data.details,
          },
        };
      }
      
      return { success: true, data: data.data, meta: data.meta };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error',
        },
      };
    }
  }
  
  private async uploadFile<T>(
    endpoint: string,
    formData: FormData
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          ...(this.token && { Authorization: `Bearer ${this.token}` }),
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.code || 'UPLOAD_ERROR',
            message: data.message || 'Upload failed',
          },
        };
      }
      
      return { success: true, data: data.data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: error instanceof Error ? error.message : 'Upload failed',
        },
      };
    }
  }
  
  // ═══════════════════════════════════════════════════════════
  // AUTH
  // ═══════════════════════════════════════════════════════════
  
  async sendOtp(emailOrPhone: string) {
    return this.request<{ sent: boolean }>('/auth/otp', {
      method: 'POST',
      body: JSON.stringify({ identifier: emailOrPhone }),
    });
  }
  
  async login(req: LoginRequest) {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }
  
  async refreshToken(refreshToken: string) {
    return this.request<{ token: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }
  
  // ═══════════════════════════════════════════════════════════
  // SMRITI (MEMORY)
  // ═══════════════════════════════════════════════════════════
  
  async uploadMemory(req: UploadMemoryRequest) {
    const formData = new FormData();
    formData.append('file', req.file);
    formData.append('type', req.type);
    if (req.title) formData.append('title', req.title);
    if (req.description) formData.append('description', req.description);
    if (req.capturedAt) formData.append('capturedAt', req.capturedAt);
    if (req.location) formData.append('location', JSON.stringify(req.location));
    if (req.placeName) formData.append('placeName', req.placeName);
    if (req.taggedMembers) formData.append('taggedMembers', JSON.stringify(req.taggedMembers));
    if (req.tags) formData.append('tags', JSON.stringify(req.tags));
    
    return this.uploadFile<UploadMemoryResponse>('/memories', formData);
  }
  
  async getMemories(req: GetMemoriesRequest) {
    const params = new URLSearchParams();
    params.set('familyId', req.familyId);
    if (req.page) params.set('page', req.page.toString());
    if (req.pageSize) params.set('pageSize', req.pageSize.toString());
    if (req.memberIds?.length) params.set('memberIds', req.memberIds.join(','));
    if (req.types?.length) params.set('types', req.types.join(','));
    if (req.searchQuery) params.set('q', req.searchQuery);
    
    return this.request<GetMemoriesResponse>(`/memories?${params}`);
  }
  
  async getMemory(id: string) {
    return this.request<{ memory: UploadMemoryResponse['memory'] }>(`/memories/${id}`);
  }
  
  // ═══════════════════════════════════════════════════════════
  // KATHA (VOICE) - Voice-Photo Stitching
  // ═══════════════════════════════════════════════════════════
  
  async recordKatha(req: RecordKathaRequest) {
    const formData = new FormData();
    formData.append('audio', req.audioBlob);
    formData.append('type', req.type);
    formData.append('narratorId', req.narratorId);
    formData.append('language', req.language);
    if (req.linkedMemories) formData.append('linkedMemories', JSON.stringify(req.linkedMemories));
    if (req.linkedMembers) formData.append('linkedMembers', JSON.stringify(req.linkedMembers));
    
    return this.uploadFile<RecordKathaResponse>('/kathas', formData);
  }
  
  async getKathas(familyId: FamilyId, options?: { narratorId?: MemberId; page?: number }) {
    const params = new URLSearchParams({ familyId });
    if (options?.narratorId) params.set('narratorId', options.narratorId);
    if (options?.page) params.set('page', options.page.toString());
    
    return this.request<{ kathas: RecordKathaResponse['katha'][] }>(`/kathas?${params}`);
  }
  
  /**
   * 🎤 VOICE-PHOTO STITCHING
   * The magic that makes photos "speak"
   */
  async stitchVoiceToPhotos(req: VoicePhotoStitchRequest) {
    return this.request<VoicePhotoStitchResponse>('/kathas/stitch', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }
  
  // ═══════════════════════════════════════════════════════════
  // VRIKSHA (FAMILY TREE)
  // ═══════════════════════════════════════════════════════════
  
  async getFamilyTree(req: GetFamilyTreeRequest) {
    const params = new URLSearchParams({ familyId: req.familyId });
    if (req.centeredOn) params.set('centeredOn', req.centeredOn);
    if (req.includeDeceased !== undefined) params.set('includeDeceased', String(req.includeDeceased));
    if (req.includePrana !== undefined) params.set('includePrana', String(req.includePrana));
    
    return this.request<GetFamilyTreeResponse>(`/vriksha?${params}`);
  }
  
  async getAncestry(req: GetAncestryRequest) {
    const params = new URLSearchParams({
      memberId: req.memberId,
      direction: req.direction,
    });
    if (req.maxDepth) params.set('maxDepth', req.maxDepth.toString());
    if (req.branch) params.set('branch', req.branch);
    
    return this.request<GetAncestryResponse>(`/vriksha/ancestry?${params}`);
  }
  
  async createMember(familyId: FamilyId, req: CreateMemberRequest) {
    const formData = new FormData();
    Object.entries(req).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'avatarBlob' && value instanceof Blob) {
          formData.append('avatar', value);
        } else if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });
    formData.append('familyId', familyId);
    
    return this.uploadFile<{ member: VrikshaMember }>('/vriksha/members', formData);
  }
  
  async addRelationship(req: AddRelationshipRequest) {
    return this.request<{ success: boolean }>('/vriksha/relationships', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }
  
  // ═══════════════════════════════════════════════════════════
  // VASIYAT (WISDOM VAULT) - Time-Locked Inheritance
  // ═══════════════════════════════════════════════════════════
  
  /**
   * 📜 CREATE TIME-LOCKED WISDOM
   * Encrypted, can only be opened when conditions are met
   */
  async createVasiyat(req: CreateVasiyatRequest) {
    const formData = new FormData();
    formData.append('title', req.title);
    formData.append('recipients', JSON.stringify(req.recipients));
    formData.append('trigger', JSON.stringify(req.trigger));
    formData.append('mood', req.mood);
    formData.append('allowAIPersona', String(req.allowAIPersona));
    
    if (req.content.text) formData.append('text', req.content.text);
    if (req.content.audioBlob) formData.append('audio', req.content.audioBlob);
    if (req.content.videoBlob) formData.append('video', req.content.videoBlob);
    if (req.content.documentBlobs) {
      req.content.documentBlobs.forEach((doc, i) => {
        formData.append(`document_${i}`, doc);
      });
    }
    if (req.witnessIds) formData.append('witnessIds', JSON.stringify(req.witnessIds));
    
    return this.uploadFile<CreateVasiyatResponse>('/vasiyat', formData);
  }
  
  async getMyVasiyats(memberId: MemberId) {
    return this.request<{ created: CreateVasiyatResponse['vasiyat'][]; received: CreateVasiyatResponse['vasiyat'][] }>(
      `/vasiyat?memberId=${memberId}`
    );
  }
  
  /**
   * ⏰ CHECK IF VASIYAT CAN BE UNLOCKED
   */
  async checkVasiyatUnlock(req: CheckVasiyatUnlockRequest) {
    return this.request<CheckVasiyatUnlockResponse>('/vasiyat/check-unlock', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }
  
  /**
   * 🔓 GET UNLOCKED VASIYAT CONTENT
   * Only works if unlock conditions are met
   */
  async getVasiyatContent(req: GetVasiyatContentRequest) {
    return this.request<GetVasiyatContentResponse>(
      `/vasiyat/${req.vasiyatId}/content?recipientId=${req.recipientId}`
    );
  }
  
  // ═══════════════════════════════════════════════════════════
  // DIGITAL ECHO - RAG-based Persona
  // ═══════════════════════════════════════════════════════════
  
  /**
   * 🪷 CHAT WITH ANCESTOR'S DIGITAL ECHO
   * Uses their voice recordings and stories to respond
   */
  async chatWithEcho(req: ChatWithEchoRequest) {
    return this.request<ChatWithEchoResponse>('/echo/chat', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }
  
  async getEchoStatus(memberId: MemberId) {
    return this.request<{
      isAvailable: boolean;
      fragmentCount: number;
      lastUpdated: string;
    }>(`/echo/${memberId}/status`);
  }
  
  // ═══════════════════════════════════════════════════════════
  // TIME-RIVER (MAIN FEED)
  // ═══════════════════════════════════════════════════════════
  
  async getTimeRiver(req: GetTimeRiverRequest) {
    const params = new URLSearchParams({ familyId: req.familyId });
    if (req.cursor) params.set('cursor', req.cursor);
    if (req.pageSize) params.set('pageSize', req.pageSize.toString());
    if (req.fromDate) params.set('fromDate', req.fromDate);
    if (req.toDate) params.set('toDate', req.toDate);
    
    return this.request<GetTimeRiverResponse>(`/timeline?${params}`);
  }
  
  // ═══════════════════════════════════════════════════════════
  // BHOOGOL YATRA (HERITAGE MAP)
  // ═══════════════════════════════════════════════════════════
  
  async getHeritageMap(req: GetHeritageMapRequest) {
    const params = new URLSearchParams({ familyId: req.familyId });
    if (req.fromYear) params.set('fromYear', req.fromYear.toString());
    if (req.toYear) params.set('toYear', req.toYear.toString());
    
    return this.request<GetHeritageMapResponse>(`/heritage-map?${params}`);
  }
  
  // ═══════════════════════════════════════════════════════════
  // SMARAN NUDGE (PASSIVE INGESTION)
  // ═══════════════════════════════════════════════════════════
  
  async getNudge(req: GetNudgeRequest) {
    return this.request<GetNudgeResponse>(
      `/nudge?memberId=${req.memberId}&context=${req.context}`
    );
  }
}

// Export singleton instance
export const api = new VanshApiClient();
