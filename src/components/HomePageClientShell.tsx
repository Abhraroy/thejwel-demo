"use client";

import { useEffect } from "react";
import { useStore } from "@/zustandStore/zustandStore";

export default function HomePageClientShell({
  categoriesProps,
}: {
  categoriesProps: any;
}) {
  const { setCategories } = useStore();

  useEffect(() => {
    setCategories(categoriesProps);
  }, [categoriesProps, setCategories]);

  return null;
}
