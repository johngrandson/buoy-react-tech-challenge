import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useGetUsersPaginated } from "./useGetUsersPaginated";
import UsersService from "services/users";

jest.mock("services/users");

const mockUsersService = UsersService as jest.Mocked<typeof UsersService>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe("useGetUsersPaginated", () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it("should fetch users with correct pagination parameters", async () => {
    const mockResponse = {
      users: [{ id: 1, firstName: "John", lastName: "Doe", email: "john@example.com", image: "image.jpg" }],
      total: 100,
      skip: 0,
      limit: 13,
    };

    mockUsersService.getAll.mockResolvedValue(mockResponse);

    const { result } = renderHook(
      () => useGetUsersPaginated({ page: 1, pageSize: 13 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockUsersService.getAll).toHaveBeenCalledWith({ limit: 13, skip: 0 });
    expect(result.current.data).toEqual(mockResponse);
  });

  it("should calculate pagination metadata correctly", async () => {
    const mockResponse = {
      users: [],
      total: 100,
      skip: 26,
      limit: 13,
    };

    mockUsersService.getAll.mockResolvedValue(mockResponse);

    const { result } = renderHook(
      () => useGetUsersPaginated({ page: 3, pageSize: 13 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.hasPreviousPage).toBe(true);
    expect(result.current.totalPages).toBe(8);
  });

  it("should handle API errors", async () => {
    const mockError = new Error("API Error");
    mockUsersService.getAll.mockRejectedValue(mockError);

    const { result } = renderHook(
      () => useGetUsersPaginated({ page: 1 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
  });

  it("should enforce exactly 13 items per page as default pageSize", async () => {
    const mockResponse = {
      users: [],
      total: 100,
      skip: 0,
      limit: 13,
    };

    mockUsersService.getAll.mockResolvedValue(mockResponse);

    const { result } = renderHook(
      () => useGetUsersPaginated({ page: 1 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // This test will FAIL if the default pageSize is not exactly 13
    expect(mockUsersService.getAll).toHaveBeenCalledWith({ limit: 13, skip: 0 });
  });
});