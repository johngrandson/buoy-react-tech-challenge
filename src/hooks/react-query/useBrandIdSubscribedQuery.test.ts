import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useBrandIdSubscribedQuery } from "./useBrandIdSubscribedQuery";
import { useGetBrandId } from "hooks";

type TestType = {
  id: number;
  name: string;
};

jest.mock("hooks", () => ({
  useGetBrandId: jest.fn(),
}));

const mockUseGetBrandId = useGetBrandId as jest.MockedFunction<typeof useGetBrandId>;

function createTestWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useBrandIdSubscribedQuery", () => {
  let mockHandler: jest.Mock;
  let mockQueryKeyBuilder: jest.Mock;

  beforeEach(() => {
    mockHandler = jest.fn();
    mockQueryKeyBuilder = jest.fn();
    jest.clearAllMocks();
  });

  it("should not fetch data when brandId is empty", () => {
    // Arrange: Mock brandId as empty string
    mockUseGetBrandId.mockReturnValue("");
    mockQueryKeyBuilder.mockReturnValue(["test", ""]);

    // Act: Render the hook
    const { result } = renderHook(
      () => useBrandIdSubscribedQuery(mockHandler, mockQueryKeyBuilder),
      { wrapper: createTestWrapper() }
    );

    // Assert: Verify it's not fetching and handler wasn't called
    expect(result.current.isFetching).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it("should fetch data when brandId is present", async () => {
    // Arrange: Mock brandId with valid value
    mockUseGetBrandId.mockReturnValue("brand123");
    mockQueryKeyBuilder.mockReturnValue(["test", "brand123"]);
    mockHandler.mockResolvedValue({ id: 1, name: "Test Brand" } as TestType);

    // Act: Render the hook
    const { result } = renderHook(
      () => useBrandIdSubscribedQuery(mockHandler, mockQueryKeyBuilder),
      { wrapper: createTestWrapper() }
    );

    // Assert: Wait for fetch to complete and verify results
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ id: 1, name: "Test Brand" });
    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(mockHandler).toHaveBeenCalledWith("brand123");
  });

  it("should not trigger unnecessary refetch when brandId changes", async () => {
    // This test verifies that React Query handles brandId changes through query key changes,
    // not through manual refetch calls (which was removed from the hook)

    // Arrange: Initial setup
    mockUseGetBrandId.mockReturnValue("brand123");
    mockQueryKeyBuilder.mockImplementation(brandId => ["brands", brandId]);
    mockHandler.mockResolvedValue({ id: 1, name: "Brand 123" });

    // Act: Render the hook
    const { result, rerender } = renderHook(
      () => useBrandIdSubscribedQuery(mockHandler, mockQueryKeyBuilder),
      { wrapper: createTestWrapper() }
    );

    // Wait for first query to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockHandler).toHaveBeenCalledTimes(1);

    // Act: Change brandId - this should trigger a new query due to query key change
    mockUseGetBrandId.mockReturnValue("brand456");
    mockHandler.mockResolvedValue({ id: 2, name: "Brand 456" });
    rerender();

    // Wait for new data
    await waitFor(() => {
      expect((result.current.data as TestType)?.id).toBe(2);
    });

    // Handler should be called exactly 2 times (once for each brandId)
    expect(mockHandler).toHaveBeenCalledTimes(2);
    expect(mockHandler).toHaveBeenNthCalledWith(1, "brand123");
    expect(mockHandler).toHaveBeenNthCalledWith(2, "brand456");
  });
});
