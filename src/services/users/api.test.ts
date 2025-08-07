import usersApiService from "./api";

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe("UsersApiService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should inject test data for user ID=4", async () => {
    const mockApiResponse = {
      users: [
        {
          id: 1,
          firstName: "John",
          lastName: "Doe",
          email: "john@test.com",
          image: "john.jpg",
        },
        {
          id: 2,
          firstName: "Jane",
          lastName: "Smith",
          email: "jane@test.com",
          image: "jane.jpg",
        },
        {
          id: 3,
          firstName: "Bob",
          lastName: "Johnson",
          email: "bob@test.com",
          image: "bob.jpg",
        },
        {
          id: 4,
          firstName: "Original",
          lastName: "Name",
          email: "original@test.com",
          image: "orig.jpg",
        },
      ],
      total: 4,
      skip: 0,
      limit: 4,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    const result = await usersApiService.getAll({ limit: 4, skip: 0 });

    expect(result.users[3]).toEqual({
      id: 4,
      firstName: "Miles",
      lastName: "Cummerata",
      email: "original@test.com",
      image: "orig.jpg",
    });
  });

  it("should maintain correct IDs", async () => {
    const mockApiResponse = {
      users: [
        {
          id: 14,
          firstName: "User14",
          lastName: "Last14",
          email: "user14@test.com",
          image: "14.jpg",
        },
        {
          id: 15,
          firstName: "User15",
          lastName: "Last15",
          email: "user15@test.com",
          image: "15.jpg",
        },
      ],
      total: 100,
      skip: 13,
      limit: 2,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    const result = await usersApiService.getAll({ limit: 2, skip: 13 });

    // IDs should be calculated as skip + index + 1
    expect(result.users[0].id).toBe(14); // 13 + 0 + 1
    expect(result.users[1].id).toBe(15); // 13 + 1 + 1
  });

  it("should handle API errors", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    await expect(usersApiService.getAll()).rejects.toThrow("Network error");
  });

  it("should handle HTTP errors", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    await expect(usersApiService.getAll()).rejects.toThrow("HTTP error! status: 404");
  });
});
