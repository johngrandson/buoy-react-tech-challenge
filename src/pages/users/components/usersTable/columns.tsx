import { ColumnsType, ColumnType } from "antd/es/table";
import { Avatar, Input, Button, Space } from "antd";
import { User } from "services/users/interface";
import { memo, useRef } from "react";
import { SearchOutlined } from "@ant-design/icons";
import type { InputRef } from "antd";
import type { FilterDropdownProps } from "antd/es/table/interface";
import userCircleIcon from "assets/images/user-circle.svg";

type DataIndex = keyof User;

/**
 * Using Avatar component instead of Image because:
 * 1. Avatar is specifically designed for user profile pictures
 * 2. Provides automatic fallback with user initials if image fails to load
 * 3. Better accessibility with built-in alt text handling
 * 4. Consistent sizing with predefined size options
 * 5. Lighter weight component for simple user images
 */
const MemoizedAvatar = memo<{ image: string; record: User }>(function MemoizedAvatar({
  image,
  record,
}) {
  return (
    <Avatar
      src={image || userCircleIcon}
      alt={`${record.firstName} ${record.lastName}`}
      size="large"
    >
      {`${record.firstName[0]}${record.lastName[0]}`}
    </Avatar>
  );
});

export const useUsersTableColumns = () => {
  const searchInput = useRef<InputRef>(null);

  const handleSearch = (confirm: FilterDropdownProps["confirm"]) => {
    confirm();
  };

  const handleReset = (
    clearFilters: () => void,
    setSelectedKeys: (keys: string[]) => void,
    confirm: FilterDropdownProps["confirm"]
  ) => {
    setSelectedKeys([]);
    clearFilters();
    confirm();
  };

  const getColumnSearchProps = (dataIndex: DataIndex): ColumnType<User> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }} onKeyDown={e => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(confirm)}
          style={{ marginBottom: 8, display: "block" }}
          autoFocus
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(confirm)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters, setSelectedKeys, confirm)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        ?.toString()
        .toLowerCase()
        .includes((value as string).toLowerCase()) ?? false,
  });

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
      ...getColumnSearchProps("firstName"),
    },
    {
      title: "Last Name",
      dataIndex: "lastName",
      key: "lastName",
      width: 120,
      ...getColumnSearchProps("lastName"),
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
      render: (image: string, record: User) => <MemoizedAvatar image={image} record={record} />,
    },
  ];

  return USERS_TABLE_COLUMNS;
};
