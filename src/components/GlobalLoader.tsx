"use client";

import { useLoading } from "@/contexts/LoadingContext";
import { Spinner } from "./ui/Spinner";

export default function GlobalLoader() {
    const { isLoading } = useLoading();

    if (!isLoading) return null;

    return <Spinner fullScreen />;
}
