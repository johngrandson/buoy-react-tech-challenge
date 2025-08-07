import { PaginatedResult } from "../base/interface";
import { BrandProfileData, BrandProfileService } from "./interface";

export class BrandProfileApiService extends BrandProfileService {
  // Stores promises to prevent concurrent requests
  private getAllPromise: Promise<PaginatedResult<BrandProfileData>> | null = null;
  private getByUserPromise: Promise<PaginatedResult<BrandProfileData>> | null = null;
  private getByIdPromises = new Map<string, Promise<BrandProfileData>>();

  /**
   * Gets all brands
   * Prevents concurrent requests using promise caching
   * @param query - Optional query parameter
   * @returns Paginated list of brand profiles
   */
  async getAll(query?: string): Promise<PaginatedResult<BrandProfileData>> {
    // If a request is already in progress, return the same promise
    if (this.getAllPromise) {
      return this.getAllPromise;
    }

    // Create and store the request promise
    this.getAllPromise = this.doGetAll(query);

    try {
      // Wait for the request to complete
      const result = await this.getAllPromise;
      return result;
    } finally {
      // Clear the promise after completion (success or failure)
      this.getAllPromise = null;
    }
  }

  /**
   * Gets brands by user with optional query
   * Prevents concurrent requests using promise caching
   * @param query - Optional search query
   * @returns Paginated list of brand profiles
   */
  async getByUser(query?: string): Promise<PaginatedResult<BrandProfileData>> {
    // If a request is already in progress, return the same promise
    if (this.getByUserPromise) {
      return this.getByUserPromise;
    }

    // Create and store the request promise
    this.getByUserPromise = this.doGetByUser(query);

    try {
      // Wait for the request to complete
      const result = await this.getByUserPromise;
      return result;
    } finally {
      // Clear the promise after completion (success or failure)
      this.getByUserPromise = null;
    }
  }

  /**
   * Gets a specific brand by ID
   * Prevents concurrent requests for the same brand using promise caching
   * @param brandId - The brand ID to fetch
   * @returns The brand profile data
   */
  async getById(brandId: number | string): Promise<BrandProfileData> {
    const key = String(brandId);

    // If a request for this brand is already in progress, return the same promise
    if (this.getByIdPromises.has(key)) {
      return this.getByIdPromises.get(key)!;
    }

    // Create and store the request promise
    const promise = this.doGetById(brandId);
    this.getByIdPromises.set(key, promise);

    try {
      // Wait for the request to complete
      const result = await promise;
      return result;
    } finally {
      // Clear the promise after completion (success or failure)
      this.getByIdPromises.delete(key);
    }
  }

  /**
   * Performs the actual getAll operation
   * @param query - Optional query parameter
   * @returns Paginated list of brand profiles
   */
  private async doGetAll(query?: string): Promise<PaginatedResult<BrandProfileData>> {
    const uri = "/brands/";
    const response = await this.get(uri);
    return response as PaginatedResult<BrandProfileData>;
  }

  /**
   * Performs the actual getByUser operation
   * @param query - Optional search query
   * @returns Paginated list of brand profiles
   */
  private async doGetByUser(query?: string): Promise<PaginatedResult<BrandProfileData>> {
    const uri = query ? `/brands/?query=${query}` : "/brands/";
    const response = await this.get(uri);
    return response as PaginatedResult<BrandProfileData>;
  }

  /**
   * Performs the actual getById operation
   * @param brandId - The brand ID to fetch
   * @returns The brand profile data
   */
  private async doGetById(brandId: number | string): Promise<BrandProfileData> {
    const uri = `/brands/${brandId}/`;
    const response = await this.get(uri);
    return response as BrandProfileData;
  }

  /**
   * Updates a brand profile
   * @param brandId - The brand ID to update
   * @param body - The data to update
   * @returns The updated brand profile data
   */
  update(brandId: number | string, body: any) {
    const uri = `/brands/${brandId}/`;
    return this.patch(uri, body);
  }
}
