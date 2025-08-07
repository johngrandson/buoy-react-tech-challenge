import { useQuery, useQueryClient, UseQueryResult } from "@tanstack/react-query";
import { useEffect } from "react";
import UsersService from "services/users";
import { UsersResponse } from "services/users/interface";

interface UseGetUsersPaginatedParams {
  page: number;
  pageSize?: number;
}

export function useGetUsersPaginated({
  page,
  pageSize = 13,
}: UseGetUsersPaginatedParams): UseQueryResult<UsersResponse> & {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  totalPages: number;
} {
  const queryClient = useQueryClient();
  const skip = (page - 1) * pageSize;

  const queryResult = useQuery({
    queryKey: ["users", "paginated", page, pageSize],
    queryFn: () => UsersService.getAll({ limit: pageSize, skip }),
    keepPreviousData: true,
    staleTime: 5000,
  });

  const { data } = queryResult;
  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  // Prefetch next page for better performance
  useEffect(() => {
    if (data && hasNextPage) {
      const nextSkip = page * pageSize;
      queryClient.prefetchQuery({
        queryKey: ["users", "paginated", page + 1, pageSize],
        queryFn: () => UsersService.getAll({ limit: pageSize, skip: nextSkip }),
        staleTime: 5000,
      });
    }
  }, [data, hasNextPage, page, pageSize, queryClient]);

  return {
    ...queryResult,
    hasNextPage,
    hasPreviousPage,
    totalPages,
  };
}
