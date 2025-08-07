import { Alert } from "antd";
import { useState, useEffect } from "react";
import { useGetUsersPaginated } from "hooks/react-query/users";
import { UsersTable } from "./components";
import ContentLayout from "components/layout/content/contentLayout";

export function Users() {
  const [pageSize, setPageSize] = useState(100);

  // Fetch all users in one page for client-side operations
  const { data, isLoading, isError, error } = useGetUsersPaginated({
    page: 1,
    pageSize,
  });

  // Dynamically adjust page size based on total
  useEffect(() => {
    if (data?.total && data.total > pageSize) {
      setPageSize(data.total);
    }
  }, [data?.total, pageSize]);

  if (isError) {
    return (
      <ContentLayout>
        <Alert
          message="Error loading users"
          description={(error as Error)?.message || "Failed to fetch users data"}
          type="error"
          showIcon
        />
      </ContentLayout>
    );
  }

  return (
    <ContentLayout>
      <UsersTable users={data?.users || []} loading={isLoading} />
    </ContentLayout>
  );
}
