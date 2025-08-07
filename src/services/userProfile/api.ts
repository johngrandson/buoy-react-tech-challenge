import { UserProfileData, UserProfileService } from "./interface";

export class UserProfileApiService extends UserProfileService {
  // Stores the getMyUser promise to prevent concurrent requests
  private getMyUserPromise: Promise<UserProfileData | undefined> | null = null;

  /**
   * Gets the current user's profile data
   * Prevents concurrent requests using promise caching
   * @returns The user profile data or undefined if not found
   */
  async getMyUser(): Promise<UserProfileData | undefined> {
    // If a request is already in progress, return the same promise
    if (this.getMyUserPromise) {
      return this.getMyUserPromise;
    }

    // Create and store the request promise
    this.getMyUserPromise = this.doGetMyUser();

    try {
      // Wait for the request to complete
      const result = await this.getMyUserPromise;
      return result;
    } finally {
      // Clear the promise after completion (success or failure)
      this.getMyUserPromise = null;
    }
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
