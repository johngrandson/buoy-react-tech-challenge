import { useGetBrandId, brandIdparamName } from "hooks";
import { useCallback } from "react";

export function useAppLinkBuilder(): (pathname: string) => string {
  const brandId = useGetBrandId();

  return useCallback(
    (pathname: string) => `${pathname}${brandId ? `?${brandIdparamName}=${brandId}` : ""}`,
    [brandId]
  );
}
