import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Users } from "./index";
import { useGetUsersPaginated } from "hooks/react-query/users";

jest.mock("hooks/react-query/users");
jest.mock("./components", () => ({
  UsersTable: ({ users, loading }: any) => (
    <div data-testid="users-table">
      {loading && <span>Loading...</span>}
      {users.map((user: any) => (
        <div key={user.id}>{user.firstName}</div>
      ))}
    </div>
  ),
}));

// Mock ContentLayout to avoid antd import issues
jest.mock("components/layout/content/contentLayout", () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));

const mockUseGetUsersPaginated = useGetUsersPaginated as jest.MockedFunction<
  typeof useGetUsersPaginated
>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("Users", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render users table with data", async () => {
    mockUseGetUsersPaginated.mockReturnValue({
      data: {
        users: [
          {
            id: 1,
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
            image: "john.jpg",
          },
          {
            id: 2,
            firstName: "Jane",
            lastName: "Smith",
            email: "jane@example.com",
            image: "jane.jpg",
          },
        ],
        total: 2,
        skip: 0,
        limit: 100,
      },
      isLoading: false,
      isError: false,
      error: null,
      hasNextPage: false,
      hasPreviousPage: false,
      totalPages: 1,
    } as any);

    render(<Users />, { wrapper: createWrapper() });

    expect(screen.getByTestId("users-table")).toBeInTheDocument();
    expect(screen.getByText("John")).toBeInTheDocument();
    expect(screen.getByText("Jane")).toBeInTheDocument();
  });

  it("should show loading state", () => {
    mockUseGetUsersPaginated.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      hasNextPage: false,
      hasPreviousPage: false,
      totalPages: 0,
    } as any);

    render(<Users />, { wrapper: createWrapper() });

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("should show error message", () => {
    mockUseGetUsersPaginated.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Failed to fetch"),
      hasNextPage: false,
      hasPreviousPage: false,
      totalPages: 0,
    } as any);

    render(<Users />, { wrapper: createWrapper() });

    expect(screen.getByText("Error loading users")).toBeInTheDocument();
    expect(screen.getByText("Failed to fetch")).toBeInTheDocument();
  });

  it("should dynamically adjust page size when total exceeds initial limit", async () => {
    mockUseGetUsersPaginated.mockImplementation(
      ({ pageSize: ps = 100 }) =>
        ({
          data: {
            users: [],
            total: 200,
            skip: 0,
            limit: ps,
          },
          isLoading: false,
          isError: false,
          error: null,
          hasNextPage: false,
          hasPreviousPage: false,
          totalPages: 1,
        }) as any
    );

    render(<Users />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(mockUseGetUsersPaginated).toHaveBeenLastCalledWith({ page: 1, pageSize: 200 });
    });
  });
});
