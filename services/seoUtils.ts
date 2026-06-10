
import { Brand } from '../types';
import { PRODUCT_CATALOG } from '../constants';

export interface SEOStatus {
    titleLength: number;
    descriptionLength: number;
    hasKeywordInTitle: boolean;
    hasKeywordInIntro: boolean;
    hasKeywordInH2: boolean;
}

/**
 * Checks the SEO status of a blog post
 */
export const checkSEOStatus = (
    title: string,
    intro: string,
    body: string,
    metaTitle: string,
    metaDescription: string,
    keyword: string
): SEOStatus => {
    const kw = (keyword || "").toLowerCase().trim();
    const t = (title || "").toLowerCase();
    const i = (intro || "").toLowerCase();
    const b = (body || "").toLowerCase();

    return {
        titleLength: (metaTitle || "").length,
        descriptionLength: (metaDescription || "").length,
        hasKeywordInTitle: t.includes(kw),
        hasKeywordInIntro: i.includes(kw),
        hasKeywordInH2: b.includes(`##`) && b.includes(kw)
    };
};

/**
 * Automatically injects internal links from the PRODUCT_CATALOG into the blog body
 */
export const injectInternalLinks = (body: string, brand: Brand): string => {
    if (!body) return "";
    const catalog = PRODUCT_CATALOG[brand];
    if (!catalog) return body;

    let newBody = body;

    // Sort keywords by length descending to avoid partial matches (e.g., "padel racket" before "racket")
    const keywords = Object.keys(catalog).sort((a, b) => b.length - a.length);

    keywords.forEach(keyword => {
        // Regex matches the keyword not inside another link or word
        // We look for the keyword as a whole word, and ensure it's not already linked
        // This is a basic implementation; more complex logic might be needed for perfect accuracy
        const url = catalog[keyword as keyof typeof catalog];

        // Replace only the first occurrence to avoid over-linking
        const regex = new RegExp(`(?<!\\[)\\b(${keyword})\\b(?![^[]*?\\])`, 'gi');

        let matchFound = false;
        newBody = newBody.replace(regex, (match) => {
            if (!matchFound) {
                matchFound = true;
                return `[${match}](${url})`;
            }
            return match;
        });
    });

    return newBody;
};
