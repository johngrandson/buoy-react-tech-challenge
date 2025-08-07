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
  });

  describe("getByUser", () => {
    it("should call get with correct endpoint for query search", async () => {
      const mockBrands: PaginatedResult<BrandProfileData> = {
        list: [{ id: 1, name: "Test Brand", slug: "test-brand" }],
        nextCursor: undefined,
        prevCursor: undefined,
      };

      mockGet.mockResolvedValueOnce(mockBrands);

      const result = await service.getByUser("test");

      expect(mockGet).toHaveBeenCalledWith("/brands/?query=test");
      expect(result).toEqual(mockBrands);
    });

    it("should call get with correct endpoint without query", async () => {
      const mockBrands: PaginatedResult<BrandProfileData> = {
        list: [],
        nextCursor: undefined,
        prevCursor: undefined,
      };

      mockGet.mockResolvedValueOnce(mockBrands);

      const result = await service.getByUser();

      expect(mockGet).toHaveBeenCalledWith("/brands/");
      expect(result).toEqual(mockBrands);
    });
  });

  describe("getById", () => {
    it("should call get with correct endpoint", async () => {
      const mockBrand: BrandProfileData = {
        id: 1,
        name: "Test Brand",
        slug: "test-brand",
      };

      mockGet.mockResolvedValueOnce(mockBrand);

      const result = await service.getById(1);

      expect(mockGet).toHaveBeenCalledWith("/brands/1/");
      expect(result).toEqual(mockBrand);
    });
  });

  describe("error handling", () => {
    it("should handle API errors", async () => {
      const error = new Error("Network error");
      mockGet.mockRejectedValueOnce(error);

      await expect(service.getAll()).rejects.toThrow("Network error");
    });
  });
});
