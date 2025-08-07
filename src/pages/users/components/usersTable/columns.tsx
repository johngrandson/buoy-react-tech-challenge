import { ColumnsType } from "antd/es/table";
import { Avatar, Input, Button, Space } from "antd";
import { User } from "services/users/interface";
import { SearchOutlined } from "@ant-design/icons";
import { memo, useCallback } from "react";

/**
 * Using Avatar component instead of Image because:
 * 1. Avatar is specifically designed for user profile pictures
 * 2. Provides automatic fallback with user initials if image fails to load
 * 3. Better accessibility with built-in alt text handling
 * 4. Consistent sizing with predefined size options
 * 5. Lighter weight component for simple user images
 */
const MemoizedAvatar = memo<{ image: string; record: User }>(function MemoizedAvatar({ image, record }) {
  return (
    <Avatar 
      src={image} 
      alt={`${record.firstName} ${record.lastName}`}
      size="large"
    >
      {`${record.firstName[0]}${record.lastName[0]}`}
    </Avatar>
  );
});

const FilterDropdown = memo<{
  placeholder: string;
  setSelectedKeys: (keys: string[]) => void;
  selectedKeys: string[];
  confirm: () => void;
  clearFilters?: () => void;
}>(function FilterDropdown({ placeholder, setSelectedKeys, selectedKeys, confirm, clearFilters }) {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedKeys(e.target.value ? [e.target.value] : []);
  }, [setSelectedKeys]);

  const handleConfirm = useCallback(() => {
    confirm();
  }, [confirm]);

  const handleClear = useCallback(() => {
    clearFilters?.();
  }, [clearFilters]);

  return (
    <div style={{ padding: 8 }}>
      <Input
        placeholder={placeholder}
        value={selectedKeys[0]}
        onChange={handleChange}
        onPressEnter={handleConfirm}
        style={{ marginBottom: 8, display: 'block' }}
      />
      <Space>
        <Button
          type="primary"
          onClick={handleConfirm}
          size="small"
          style={{ width: 90 }}
        >
          Filter
        </Button>
        <Button
          onClick={handleClear}
          size="small"
          style={{ width: 90 }}
        >
          Reset
        </Button>
      </Space>
    </div>
  );
});

const MemoizedFilterIcon = memo<{ filtered: boolean }>(function FilterIcon({ filtered }) {
  return <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />;
});

const createFilterDropdown = (placeholder: string) => (props: any) => (
  <FilterDropdown placeholder={placeholder} {...props} />
);

const createFilterIcon = () => (filtered: boolean) => (
  <MemoizedFilterIcon filtered={filtered} />
);

const USERS_TABLE_COLUMNS: ColumnsType<User> = [
  {
    title: "ID",
    dataIndex: "id",
    key: "id",
    width: 60,
  },
  {
    title: "First Name",
    dataIndex: "firstName",
    key: "firstName",
    width: 120,
    filterDropdown: createFilterDropdown("Search First Name"),
    filterIcon: createFilterIcon(),
    onFilter: (value, record) =>
      record.firstName.toLowerCase().includes(value.toString().toLowerCase()),
  },
  {
    title: "Last Name",
    dataIndex: "lastName",
    key: "lastName",
    width: 120,
    filterDropdown: createFilterDropdown("Search Last Name"),
    filterIcon: createFilterIcon(),
    onFilter: (value, record) =>
      record.lastName.toLowerCase().includes(value.toString().toLowerCase()),
  },
  {
    title: "Name",
    key: "fullName",
    width: 200,
    render: (_, record: User) => `${record.firstName} ${record.lastName}`,
  },
  {
    title: "Email",
    dataIndex: "email",
    key: "email",
    width: 250,
    sorter: (a: User, b: User) => a.email.localeCompare(b.email),
    ellipsis: true,
  },
  {
    title: "Image",
    dataIndex: "image",
    key: "image",
    width: 80,
    render: (image: string, record: User) => (
      <MemoizedAvatar image={image} record={record} />
    ),
  },
];

export const getUsersTableColumns = (): ColumnsType<User> => USERS_TABLE_COLUMNS;