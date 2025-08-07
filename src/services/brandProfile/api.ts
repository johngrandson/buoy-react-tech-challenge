import { PaginatedResult } from "../base/interface";
import { BrandProfileData, BrandProfileService } from "./interface";

export class BrandProfileApiService extends BrandProfileService {
  /**
   * Gets all brands
   * @param query - Optional query parameter
   * @returns Paginated list of brand profiles
   */
  async getAll(query?: string): Promise<PaginatedResult<BrandProfileData>> {
    const uri = "/brands/";
    const response = await this.get(uri);
    return response as PaginatedResult<BrandProfileData>;
  }

  /**
   * Gets brands by user with optional query
   * @param query - Optional search query
   * @returns Paginated list of brand profiles
   */
  async getByUser(query?: string): Promise<PaginatedResult<BrandProfileData>> {
    const uri = query ? `/brands/?query=${query}` : "/brands/";
    const response = await this.get(uri);
    return response as PaginatedResult<BrandProfileData>;
  }

  /**
   * Gets a specific brand by ID
   * @param brandId - The brand ID to fetch
   * @returns The brand profile data
   */
  async getById(brandId: number | string): Promise<BrandProfileData> {
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
