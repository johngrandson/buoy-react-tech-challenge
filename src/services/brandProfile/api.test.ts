import { BrandProfileApiService } from "./api";
import { BrandProfileData } from "./interface";
import { PaginatedResult } from "../base/interface";

// Create a type that exposes protected members for testing
type BrandProfileApiServiceWithProtected = BrandProfileApiService & {
  get: BrandProfileApiService["get"];
};

describe("BrandProfileApiService", () => {
  let service: BrandProfileApiService;
  let mockGet: jest.Mock;

  beforeEach(() => {
    service = new BrandProfileApiService();
    mockGet = jest.fn();

    // Cast to our test type to access protected methods safely
    const serviceWithProtected = service as BrandProfileApiServiceWithProtected;
    jest.spyOn(serviceWithProtected, "get").mockImplementation(mockGet);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getAll", () => {
    it("should call get with correct endpoint", async () => {
      const mockBrands: PaginatedResult<BrandProfileData> = {
        list: [
          { id: 1, name: "Brand A", slug: "brand-a" },
          { id: 2, name: "Brand B", slug: "brand-b" },
        ],
        nextCursor: undefined,
        prevCursor: undefined,
      };

      mockGet.mockResolvedValueOnce(mockBrands);

      const result = await service.getAll();

      expect(mockGet).toHaveBeenCalledWith("/brands/");
      expect(result).toEqual(mockBrands);
    });

    it("should only make one request when called multiple times simultaneously", async () => {
      const mockBrands: PaginatedResult<BrandProfileData> = {
        list: [{ id: 1, name: "Brand A", slug: "brand-a" }],
        nextCursor: undefined,
        prevCursor: undefined,
      };

      mockGet.mockResolvedValueOnce(mockBrands);

      // Call getAll multiple times simultaneously
      const promises = [service.getAll(), service.getAll(), service.getAll()];

      const results = await Promise.all(promises);

      // All calls should return the same data
      expect(results[0]).toEqual(mockBrands);
      expect(results[1]).toEqual(mockBrands);
      expect(results[2]).toEqual(mockBrands);

      // But get should only be called once
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith("/brands/");
    });
  });
});
