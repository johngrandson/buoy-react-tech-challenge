import { Table, TableProps, Button } from "antd";
import { User } from "services/users/interface";
import { useUsersTableColumns } from "./columns";
import { memo, useState, useCallback } from "react";

interface UsersTableProps extends Omit<TableProps<User>, "columns" | "dataSource"> {
  users: User[];
  loading?: boolean;
}

export const UsersTable = memo<UsersTableProps>(function UsersTable({
  users,
  loading,
  ...tableProps
}) {
  const [filterResetKey, setFilterResetKey] = useState(0);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  const handleClearAllFilters = useCallback(() => {
    // Force re-render of columns to reset all filters
    setFilterResetKey(prev => prev + 1);
    setHasActiveFilters(false);
  }, []);

  const handleFilterChange = useCallback((_pagination: any, filters: any) => {
    // Check if any filter has values
    const hasFilters = Object.values(filters).some(
      filterValue => filterValue && (filterValue as string[]).length > 0
    );
    setHasActiveFilters(hasFilters);
  }, []);

  const columns = useUsersTableColumns();

  return (
    <>
      {hasActiveFilters && (
        <div style={{ marginBottom: 16 }}>
          <Button onClick={handleClearAllFilters}>Clear All Filters</Button>
        </div>
      )}
      <Table<User>
        key={filterResetKey} // Force re-render when filters are cleared
        columns={columns}
        dataSource={users}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 13,
          showSizeChanger: false,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`,
        }}
        scroll={{ x: 1200 }}
        onChange={handleFilterChange}
        {...tableProps}
      />
    </>
  );
});
