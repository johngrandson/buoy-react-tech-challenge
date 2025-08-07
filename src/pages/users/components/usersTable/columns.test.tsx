import { renderHook } from "@testing-library/react";
import { useUsersTableColumns } from "./columns";

describe("useUsersTableColumns", () => {
  it("should return columns configuration", () => {
    const { result } = renderHook(() => useUsersTableColumns());
    const columns = result.current;

    expect(columns).toHaveLength(6);
    expect(columns[0].title).toBe("ID");
    expect(columns[1].title).toBe("First Name");
    expect(columns[2].title).toBe("Last Name");
    expect(columns[3].title).toBe("Name");
    expect(columns[4].title).toBe("Email");
    expect(columns[5].title).toBe("Image");
  });

  it("should have search filters for First Name and Last Name", () => {
    const { result } = renderHook(() => useUsersTableColumns());
    const columns = result.current;

    const firstNameColumn = columns.find(col => col.key === "firstName");
    const lastNameColumn = columns.find(col => col.key === "lastName");

    expect(firstNameColumn?.filterDropdown).toBeDefined();
    expect(firstNameColumn?.onFilter).toBeDefined();
    expect(lastNameColumn?.filterDropdown).toBeDefined();
    expect(lastNameColumn?.onFilter).toBeDefined();
  });

  it("should filter correctly by first name", () => {
    const { result } = renderHook(() => useUsersTableColumns());
    const columns = result.current;
    const firstNameColumn = columns.find(col => col.key === "firstName");
    
    const testUser = { id: 4, firstName: "Miles", lastName: "Cummerata", email: "test@test.com", image: "test.jpg" };
    
    expect(firstNameColumn?.onFilter?.("miles", testUser)).toBe(true);
    expect(firstNameColumn?.onFilter?.("john", testUser)).toBe(false);
  });

  it("should filter correctly by last name", () => {
    const { result } = renderHook(() => useUsersTableColumns());
    const columns = result.current;
    const lastNameColumn = columns.find(col => col.key === "lastName");
    
    const testUser = { id: 4, firstName: "Miles", lastName: "Cummerata", email: "test@test.com", image: "test.jpg" };
    
    expect(lastNameColumn?.onFilter?.("cummerata", testUser)).toBe(true);
    expect(lastNameColumn?.onFilter?.("smith", testUser)).toBe(false);
  });
});