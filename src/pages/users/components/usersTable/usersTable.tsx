import { Table, TableProps } from "antd";
import { User } from "services/users/interface";
import { getUsersTableColumns } from "./columns";
import { useMemo, memo } from "react";

interface UsersTableProps extends Omit<TableProps<User>, "columns" | "dataSource"> {
  users: User[];
  loading?: boolean;
}

export const UsersTable = memo<UsersTableProps>(function UsersTable({ users, loading, ...tableProps }) {
  // Get pre-computed columns (already optimized)
  const columns = getUsersTableColumns();

  // Memoize the entire table to avoid unnecessary re-renders
  // Only re-render when users data or loading state changes
  const MemoizedTable = useMemo(() => (
    <Table<User>
      columns={columns}
      dataSource={users}
      loading={loading}
      rowKey="id"
      pagination={{
        pageSize: 13,
        showSizeChanger: false,
        showTotal: (total, range) => 
          `${range[0]}-${range[1]} of ${total} users`,
      }}
      scroll={{ x: 1200 }}
      {...tableProps}
    />
  ), [columns, users, loading, tableProps]);

  return MemoizedTable;
});