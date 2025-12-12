import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export function formatNumber(num: number): string {
    return new Intl.NumberFormat("en-US").format(num);
}

export function getInitials(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

export function generateRandomScore(): number {
    return Math.floor(Math.random() * 40) + 60; // 60-100 range
}

export function generateRandomExperience(): number {
    return Math.floor(Math.random() * 12) + 1; // 1-12 years
}
