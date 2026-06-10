import { BlogContent, Brand } from "../types";

export interface MemorizedBlog {
    title: string;
    brand: Brand;
    summary: string;
    date: string;
    urlSlug: string;
    posted?: boolean;
}

export const memorizeBlog = async (blog: BlogContent, brand: Brand) => {
    const summary = blog.introduction.substring(0, 200) + "..."; // Simple summary
    const payload: Partial<MemorizedBlog> = {
        title: blog.title,
        brand,
        summary,
        urlSlug: blog.urlSlug
    };

    const response = await fetch('/api/memorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error('Failed to memorize blog');
    }

    return response.json();
};

export const togglePosted = async (title: string): Promise<boolean> => {
    const response = await fetch('/api/toggle-posted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
    });
    const data = await response.json();
    return data.posted;
};

export const getMemory = async (): Promise<{ blogs: MemorizedBlog[] }> => {
    try {
        const response = await fetch('/api/memory');
        if (!response.ok) return { blogs: [] };
        return response.json();
    } catch (e) {
        console.error("Failed to fetch memory:", e);
        return { blogs: [] };
    }
};
