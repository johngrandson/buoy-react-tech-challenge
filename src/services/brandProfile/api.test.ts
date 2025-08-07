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

    it("should only make one request when called multiple times simultaneously", async () => {
      const mockBrands: PaginatedResult<BrandProfileData> = {
        list: [{ id: 1, name: "Brand A", slug: "brand-a" }],
        nextCursor: undefined,
        prevCursor: undefined,
      };

      mockGet.mockResolvedValueOnce(mockBrands);

      // Call getByUser multiple times simultaneously
      const promises = [
        service.getByUser("search"),
        service.getByUser("search"),
        service.getByUser("search"),
      ];

      const results = await Promise.all(promises);

      // All calls should return the same data
      expect(results[0]).toEqual(mockBrands);
      expect(results[1]).toEqual(mockBrands);
      expect(results[2]).toEqual(mockBrands);

      // But get should only be called once
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith("/brands/?query=search");
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

    it("should only make one request per brand ID when called multiple times simultaneously", async () => {
      const mockBrand1: BrandProfileData = {
        id: 1,
        name: "Brand 1",
        slug: "brand-1",
      };

      const mockBrand2: BrandProfileData = {
        id: 2,
        name: "Brand 2",
        slug: "brand-2",
      };

      mockGet.mockResolvedValueOnce(mockBrand1);
      mockGet.mockResolvedValueOnce(mockBrand2);

      // Call getById for same brand multiple times + different brand
      const promises = [
        service.getById(1),
        service.getById(1), // Should reuse promise for brand 1
        service.getById(1), // Should reuse promise for brand 1
        service.getById(2), // Should create new promise for brand 2
      ];

      const results = await Promise.all(promises);

      // First three calls should return brand 1 data
      expect(results[0]).toEqual(mockBrand1);
      expect(results[1]).toEqual(mockBrand1);
      expect(results[2]).toEqual(mockBrand1);

      // Fourth call should return brand 2 data
      expect(results[3]).toEqual(mockBrand2);

      // Should make exactly 2 API calls (one per unique brand ID)
      expect(mockGet).toHaveBeenCalledTimes(2);
      expect(mockGet).toHaveBeenCalledWith("/brands/1/");
      expect(mockGet).toHaveBeenCalledWith("/brands/2/");
    });

    it("should handle string brand IDs correctly", async () => {
      const mockBrand: BrandProfileData = {
        id: 1,
        name: "String ID Brand",
        slug: "string-id-brand",
      };

      mockGet.mockResolvedValueOnce(mockBrand);

      // Call with string ID multiple times
      const promises = [
        service.getById("abc123"),
        service.getById("abc123"),
        service.getById("abc123"),
      ];

      const results = await Promise.all(promises);

      // All calls should return the same data
      results.forEach(result => {
        expect(result).toEqual(mockBrand);
      });

      // But get should only be called once
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith("/brands/abc123/");
    });
  });

  describe("error handling", () => {
    it("should handle errors properly and clear promise cache for getAll", async () => {
      const error = new Error("Network error");
      mockGet.mockRejectedValueOnce(error);

      // First call should fail
      await expect(service.getAll()).rejects.toThrow("Network error");

      // Second call should make a new request (promise cache cleared after error)
      const mockBrands: PaginatedResult<BrandProfileData> = {
        list: [{ id: 1, name: "Brand A", slug: "brand-a" }],
        nextCursor: undefined,
        prevCursor: undefined,
      };
      mockGet.mockResolvedValueOnce(mockBrands);

      const result = await service.getAll();

      expect(result).toEqual(mockBrands);
      expect(mockGet).toHaveBeenCalledTimes(2);
    });

    it("should handle errors properly and clear promise cache for getById", async () => {
      const error = new Error("Brand not found");
      mockGet.mockRejectedValueOnce(error);

      // First call should fail
      await expect(service.getById(999)).rejects.toThrow("Brand not found");

      // Second call should make a new request (promise cache cleared after error)
      const mockBrand: BrandProfileData = {
        id: 999,
        name: "Found Brand",
        slug: "found-brand",
      };
      mockGet.mockResolvedValueOnce(mockBrand);

      const result = await service.getById(999);

      expect(result).toEqual(mockBrand);
      expect(mockGet).toHaveBeenCalledTimes(2);
    });
  });

  describe("multiple service instances", () => {
    it("should handle multiple service instances with independent promise caching", async () => {
      // Create two separate service instances
      const service1 = new BrandProfileApiService();
      const service2 = new BrandProfileApiService();

      // Mock get for both services
      const mockGet1 = jest.fn();
      const mockGet2 = jest.fn();

      const serviceWithProtected1 = service1 as BrandProfileApiServiceWithProtected;
      const serviceWithProtected2 = service2 as BrandProfileApiServiceWithProtected;

      jest.spyOn(serviceWithProtected1, "get").mockImplementation(mockGet1);
      jest.spyOn(serviceWithProtected2, "get").mockImplementation(mockGet2);

      // Different brand data for each service
      const brands1: PaginatedResult<BrandProfileData> = {
        list: [{ id: 1, name: "Service 1 Brand", slug: "service-1-brand" }],
        nextCursor: undefined,
        prevCursor: undefined,
      };

      const brands2: PaginatedResult<BrandProfileData> = {
        list: [{ id: 2, name: "Service 2 Brand", slug: "service-2-brand" }],
        nextCursor: undefined,
        prevCursor: undefined,
      };

      // Mock responses
      mockGet1.mockResolvedValueOnce(brands1);
      mockGet2.mockResolvedValueOnce(brands2);

      // Call getAll for both services simultaneously
      const promises = [
        service1.getAll(),
        service1.getAll(), // Should reuse service1's promise
        service2.getAll(),
        service2.getAll(), // Should reuse service2's promise
      ];

      const results = await Promise.all(promises);

      // Service1 calls should return service1's brand data
      expect(results[0]).toEqual(brands1);
      expect(results[1]).toEqual(brands1);

      // Service2 calls should return service2's brand data
      expect(results[2]).toEqual(brands2);
      expect(results[3]).toEqual(brands2);

      // Each service should only make one get call
      expect(mockGet1).toHaveBeenCalledTimes(1);
      expect(mockGet1).toHaveBeenCalledWith("/brands/");

      expect(mockGet2).toHaveBeenCalledTimes(1);
      expect(mockGet2).toHaveBeenCalledWith("/brands/");
    });
  });
});
