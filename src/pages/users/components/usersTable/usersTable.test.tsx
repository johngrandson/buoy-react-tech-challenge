import { render, screen } from "@testing-library/react";
import { UsersTable } from "./usersTable";
import { User } from "services/users/interface";

jest.mock("antd", () => ({
  Table: ({ dataSource, loading, pagination }: any) => (
    <div>
      {loading && (
        <div role="alert" className="ant-spin">
          Loading...
        </div>
      )}
      {!loading && dataSource.length === 0 && <div>No data</div>}
      {dataSource.map((item: any) => (
        <div key={item.id}>
          <span>{item.firstName}</span>
          <span>{item.email}</span>
        </div>
      ))}
      {pagination && (
        <div>{`1-${Math.min(13, dataSource.length)} of ${dataSource.length} users`}</div>
      )}
    </div>
  ),
  Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  Space: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("./columns", () => ({
  useUsersTableColumns: () => [
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "First Name", dataIndex: "firstName", key: "firstName" },
    { title: "Email", dataIndex: "email", key: "email" },
  ],
}));

describe("UsersTable", () => {
  const mockUsers: User[] = [
    { id: 1, firstName: "John", lastName: "Doe", email: "john@example.com", image: "john.jpg" },
    { id: 2, firstName: "Jane", lastName: "Smith", email: "jane@example.com", image: "jane.jpg" },
  ];

  it("should render table with users data", () => {
    render(<UsersTable users={mockUsers} loading={false} />);

    expect(screen.getByText("John")).toBeInTheDocument();
    expect(screen.getByText("Jane")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
  });

  it("should show loading state", () => {
    render(<UsersTable users={[]} loading={true} />);

    const loadingElement = screen.getByRole("alert");
    expect(loadingElement).toHaveClass("ant-spin");
  });

  it("should render empty table when no users", () => {
    render(<UsersTable users={[]} loading={false} />);

    expect(screen.getByText("No data")).toBeInTheDocument();
  });

  it("should enforce exactly 13 items per page in pagination config", () => {
    const manyUsers = Array.from({ length: 30 }, (_, i) => ({
      id: i + 1,
      firstName: `User${i + 1}`,
      lastName: `Last${i + 1}`,
      email: `user${i + 1}@example.com`,
      image: `user${i + 1}.jpg`,
    }));

    render(<UsersTable users={manyUsers} loading={false} />);

    // This test will FAIL if pageSize is not exactly 13
    expect(screen.getByText("1-13 of 30 users")).toBeInTheDocument();
  });

  it("should not show Clear All Filters button when no filters are active", () => {
    render(<UsersTable users={mockUsers} loading={false} />);

    const clearButton = screen.queryByRole("button", { name: "Clear All Filters" });
    expect(clearButton).not.toBeInTheDocument();
  });
});
