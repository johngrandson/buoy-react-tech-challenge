import { UserProfileData, UserProfileService } from "./interface";

export class UserProfileApiService extends UserProfileService {
  // Singleton instance to ensure consistent promise caching across the application
  private static instance: UserProfileApiService | null = null;

  // Promise cache to prevent concurrent duplicate requests
  private requestCache: Map<string, Promise<any>> = new Map();

  /**
   * Gets the singleton instance of UserProfileApiService
   * This ensures promise caching works consistently across all API calls
   */
  public static getInstance(): UserProfileApiService {
    if (!UserProfileApiService.instance) {
      UserProfileApiService.instance = new UserProfileApiService();
    }
    return UserProfileApiService.instance;
  }

  /**
   * Resets the singleton instance (useful for testing)
   */
  public static resetInstance(): void {
    UserProfileApiService.instance = null;
  }

  /**
   * Gets the current user's profile data
   * Prevents concurrent requests using promise caching
   * @returns The user profile data or undefined if not found
   */
  async getMyUser(): Promise<UserProfileData | undefined> {
    const cacheKey = "getMyUser";

    // Check if request is already in progress
    if (this.requestCache.has(cacheKey)) {
      return this.requestCache.get(cacheKey);
    }

    // Create and cache the request promise
    const requestPromise = this.doGetMyUser();
    this.requestCache.set(cacheKey, requestPromise);

    // Don't auto-cleanup - let natural cache invalidation handle it
    // The cache will be cleared when a new request is needed or on logout
    return requestPromise;
  }

  /**
   * Performs the actual user profile fetch operation
   * @returns The user profile data
   */
  private async doGetMyUser(): Promise<UserProfileData | undefined> {
    const uri = "/users/me/";
    const data = await this.get(uri);
    return data as UserProfileData;
  }

  /**
   * Updates the current user's profile data
   * @param body - The data to update
   * @returns The updated user profile data
   */
  updateMyUser(body: any) {
    const uri = "/users/me/";
    return this.patch(uri, body);
  }
}
