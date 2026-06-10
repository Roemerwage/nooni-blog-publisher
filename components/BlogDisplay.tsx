import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { checkSEOStatus } from '../services/seoUtils';
import { Search, Calendar, Copy, Check, ExternalLink, Brain, ShieldCheck, AlertCircle, Send } from 'lucide-react';

import { saveAs } from 'file-saver';
import { Brand, BlogContent } from '../types';
import { BRAND_CONFIG } from '../constants';
import { useKlaviyo } from '../hooks/useKlaviyo';

const KLAVIYO_ADMIN_EMAIL = import.meta.env.VITE_KLAVIYO_ADMIN_EMAIL || 'team@getnooni.com';

interface BlogDisplayProps {
    blog: BlogContent | null;
    loading: boolean;
    selectedBrand: Brand;
    copied: boolean;
    copyToClipboard: () => void;
    memorize: () => void;
    memorized: boolean;
    keyword: string;
    imageLoading: boolean;
}

const LoadingSkeleton: React.FC = () => (
    <section className="lg:col-span-8 space-y-5">
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
            <div className="bg-slate-50 border-b px-8 py-4 flex items-center justify-between">
                <div className="h-6 w-20 bg-slate-200 rounded-lg animate-pulse" />
                <div className="flex gap-3">
                    <div className="h-9 w-36 bg-slate-200 rounded-xl animate-pulse" />
                    <div className="h-9 w-32 bg-slate-200 rounded-xl animate-pulse" />
                </div>
            </div>
            <div className="p-12 space-y-4">
                <div className="h-9 w-3/4 bg-slate-100 rounded-xl animate-pulse" />
                <div className="h-4 w-36 bg-slate-100 rounded-lg animate-pulse" />
                <div className="space-y-2.5 mt-8">
                    <div className="h-4 bg-slate-100 rounded animate-pulse" />
                    <div className="h-4 w-11/12 bg-slate-100 rounded animate-pulse" />
                    <div className="h-4 w-4/5 bg-slate-100 rounded animate-pulse" />
                </div>
                <div className="space-y-2.5 mt-6">
                    <div className="h-6 w-52 bg-slate-100 rounded-lg animate-pulse" />
                    <div className="h-4 bg-slate-100 rounded animate-pulse" />
                    <div className="h-4 w-10/12 bg-slate-100 rounded animate-pulse" />
                    <div className="h-4 w-4/6 bg-slate-100 rounded animate-pulse" />
                </div>
                <div className="space-y-2.5 mt-6">
                    <div className="h-6 w-44 bg-slate-100 rounded-lg animate-pulse" />
                    <div className="h-4 bg-slate-100 rounded animate-pulse" />
                    <div className="h-4 w-5/6 bg-slate-100 rounded animate-pulse" />
                    <div className="h-4 w-3/5 bg-slate-100 rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-2 pt-4">
                    <div className="h-4 w-4 rounded-full bg-slate-100 animate-pulse" />
                    <div className="h-4 w-48 bg-slate-100 rounded animate-pulse" />
                </div>
            </div>
        </div>
    </section>
);

const EmptyState: React.FC = () => (
    <section className="lg:col-span-8 flex items-center justify-center min-h-[560px]">
        <div className="text-center">
            <div className="flex items-end justify-center gap-3 mb-10">
                <div className="w-14 h-14 rounded-2xl border border-[#E4CFBB] flex items-center justify-center" style={{background: 'rgba(228,207,187,0.15)'}}>
                    <div className="w-5 h-5 rounded-full bg-[#E4CFBB]" />
                </div>
                <div className="w-[72px] h-[72px] rounded-2xl border border-[#688662]/40 flex items-center justify-center mb-1" style={{background: 'rgba(104,134,98,0.08)'}}>
                    <div className="w-6 h-6 rounded-full bg-[#688662]" />
                </div>
                <div className="w-14 h-14 rounded-2xl border border-[#274472]/20 flex items-center justify-center" style={{background: 'rgba(39,68,114,0.05)'}}>
                    <div className="w-5 h-5 rounded-full bg-[#274472]" />
                </div>
            </div>

            <h2 className="text-2xl font-semibold text-slate-800 mb-3" style={{fontFamily: "'Lora', Georgia, serif"}}>
                Klaar om te schrijven?
            </h2>
            <p className="text-sm text-slate-400 max-w-[280px] mx-auto leading-relaxed">
                Kies een keyword, voer je blogtitel in en genereer een SEO-artikel voor Shopify.
            </p>

            <div className="mt-10 flex items-center justify-center gap-6 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                <span>Coffee</span>
                <span className="w-1 h-1 rounded-full bg-slate-200" />
                <span>Matcha</span>
                <span className="w-1 h-1 rounded-full bg-slate-200" />
                <span>Cacao</span>
            </div>
        </div>
    </section>
);

const BlogDisplay: React.FC<BlogDisplayProps> = ({
    blog,
    loading,
    selectedBrand,
    copied,
    copyToClipboard,
    memorize,
    memorized,
    keyword,
    imageLoading
}) => {
    const getSlug = () => blog?.urlSlug || blog?.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'blog';

    const { trackEvent } = useKlaviyo();
    const [heroDownloading, setHeroDownloading] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [published, setPublished] = useState<string | null>(null);

    const handlePublish = async () => {
        if (!blog) return;
        setPublishing(true);
        try {
            const cleanBody = blog.body.replace(/\!\[.*?\]\(.*?\)/g, '');
            const { marked } = await import('marked');
            const bodyHtml = await marked.parse(cleanBody);
            const fullHtml = `<p><em>${blog.introduction}</em></p>${bodyHtml}<h2>Conclusie</h2><p>${blog.conclusion}</p>`;

            const response = await fetch('/api/shopify-publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: blog.title,
                    body_html: fullHtml,
                    handle: blog.urlSlug,
                    summary_html: blog.metaDescription,
                    metafields: [
                        { namespace: 'global', key: 'title_tag', value: blog.metaTitle, type: 'single_line_text_field' },
                        { namespace: 'global', key: 'description_tag', value: blog.metaDescription, type: 'single_line_text_field' },
                    ],
                    published: false,
                }),
            });
            const data = await response.json();
            if (data.article?.id) {
                const publishedUrl = `https://getnooni.com/blogs/news/${data.article.handle}`;
                setPublished(publishedUrl);

                // Track in Klaviyo — non-blocking, won't affect publish UX if it fails
                trackEvent(KLAVIYO_ADMIN_EMAIL, 'Blog Published', {
                    title: blog.title,
                    url: publishedUrl,
                    slug: blog.urlSlug,
                    metaTitle: blog.metaTitle,
                    brand: 'nooni',
                    publishedAt: new Date().toISOString(),
                }).catch(() => {});
            } else {
                throw new Error(data.error || JSON.stringify(data));
            }
        } catch (err: any) {
            alert(`Publiceren mislukt: ${err.message}`);
        } finally {
            setPublishing(false);
        }
    };

    const downloadHeroWithText = (dataUrl: string, title: string, filename: string) => {
        setHeroDownloading(true);
        const img = new Image();
        img.onload = () => {
            // Render at 2x for crisp text, then output the high-res version
            const scale = 2;
            const canvas = document.createElement('canvas');
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d')!;
            ctx.scale(scale, scale);

            ctx.drawImage(img, 0, 0, img.width, img.height);

            // Left gradient
            const grad = ctx.createLinearGradient(0, 0, img.width * 0.6, 0);
            grad.addColorStop(0, 'rgba(16, 13, 10, 0.78)');
            grad.addColorStop(0.5, 'rgba(16, 13, 10, 0.40)');
            grad.addColorStop(1, 'rgba(16, 13, 10, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, img.width, img.height);

            const pad = img.width * 0.047;
            const maxWidth = img.width * 0.44;
            const titleSize = Math.round(img.height * 0.092);
            ctx.font = `italic bold ${titleSize}px Georgia, 'Times New Roman', serif`;
            ctx.fillStyle = '#ffffff';
            ctx.textBaseline = 'alphabetic';

            const words = title.split(' ');
            const lines: string[] = [];
            let cur = '';
            for (const w of words) {
                const test = cur ? `${cur} ${w}` : w;
                if (ctx.measureText(test).width > maxWidth && cur) { lines.push(cur); cur = w; }
                else cur = test;
            }
            if (cur) lines.push(cur);

            const lh = titleSize * 1.2;
            const startY = (img.height - lh * lines.length) / 2 + titleSize;
            lines.forEach((line, i) => ctx.fillText(line, pad, startY + i * lh));

            canvas.toBlob((blob) => {
                if (!blob) return;
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(url);
                setHeroDownloading(false);
            }, 'image/png');
        };
        img.src = dataUrl;
    };

    const handleDownloadImage = async (imagePath: string, index: number) => {
        try {
            const response = await fetch(imagePath);
            const blob = await response.blob();
            const slug = getSlug();
            const ext = imagePath.split('.').pop() || 'jpg';
            saveAs(blob, `${slug}-${index + 1}.${ext}`);
        } catch (error) {
            console.error("Failed to download image:", error);
        }
    };

    if (loading && !blog) return <LoadingSkeleton />;
    if (!blog) return <EmptyState />;

    const seoStatus = checkSEOStatus(
        blog.title,
        blog.introduction,
        blog.body,
        blog.metaTitle,
        blog.metaDescription,
        keyword
    );

    return (
        <section className="lg:col-span-8 max-w-7xl mx-auto space-y-5 pb-20">
            {/* Photo manager */}
            {(blog.selectedImage1 || blog.selectedImage2 || blog.selectedImage3 || blog.selectedImage4 || blog.selectedImage5) && (
                <div className="bg-slate-800 text-white p-6 rounded-[2rem] shadow-xl">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-5 pb-3 border-b border-slate-700/60">
                        Aanbevolen Afbeeldingen — AI Selectie
                    </h4>
                    <div className="space-y-3">
                        {[blog.selectedImage1, blog.selectedImage2, blog.selectedImage3, blog.selectedImage4, blog.selectedImage5].filter(Boolean).map((imgName, idx) => {
                            const imagePath = `/images/nooni/${imgName?.trim()}`;
                            const seoName = `${getSlug()}-${idx + 1}.${imgName?.split('.').pop() || 'jpg'}`;
                            return (
                                <div key={idx} className="flex items-center justify-between bg-slate-700/20 p-4 rounded-2xl border border-slate-700/40 hover:bg-slate-700/40 transition-colors">
                                    <div className="flex items-center gap-5">
                                        <div className="relative">
                                            <img
                                                src={imagePath}
                                                alt={seoName}
                                                className="w-16 h-16 object-cover rounded-xl border border-slate-600 shadow-lg"
                                            />
                                            <span className="absolute -top-1.5 -left-1.5 bg-slate-900 text-[10px] font-black px-1.5 py-0.5 rounded-md text-emerald-400 border border-slate-700">
                                                #{idx + 1}
                                            </span>
                                        </div>
                                        <div>
                                            <code className="text-xs text-emerald-400 font-mono font-bold block truncate max-w-[280px]">{seoName}</code>
                                            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-medium">Sla op voor Shopify</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDownloadImage(imagePath, idx)}
                                        className="cursor-pointer bg-white text-slate-900 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-[#E4CFBB] transition-all active:scale-95 shadow-md flex items-center gap-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                                        Download
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* AI Generated Images */}
            {(imageLoading || (blog.generatedImages && blog.generatedImages.length > 0)) && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                            AI Gegenereerde Afbeeldingen — GPT Image
                        </span>
                        {imageLoading && (
                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest animate-pulse">
                                Genereren…
                            </span>
                        )}
                    </div>

                    {/* Hero image — full width, CSS text overlay, original quality download */}
                    {blog.generatedImages?.[0] ? (
                        <div className="group relative rounded-[2rem] overflow-hidden shadow-xl aspect-video">
                            <img
                                src={blog.generatedImages[0]}
                                alt={blog.title}
                                className="w-full h-full object-cover object-center"
                            />
                            {/* Gradient left-side overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent pointer-events-none" />
                            {/* Title text */}
                            <div className="absolute inset-0 flex flex-col justify-center px-10 pointer-events-none" style={{maxWidth: '52%'}}>
                                <h2 className="text-white font-bold italic leading-tight drop-shadow-lg" style={{fontFamily: "'Georgia', 'Times New Roman', serif", fontSize: 'clamp(1.4rem, 2.8vw, 2.4rem)'}}>
                                    {blog.title}
                                </h2>
                            </div>
                            {/* Download — bakes text overlay into PNG on click */}
                            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => downloadHeroWithText(blog.generatedImages![0], blog.title, `${getSlug()}-hero.png`)}
                                    disabled={heroDownloading}
                                    className="cursor-pointer bg-white/90 backdrop-blur text-slate-900 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-[#E4CFBB] transition-all flex items-center gap-2 shadow-lg disabled:opacity-60"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                                    {heroDownloading ? 'Bezig…' : 'Download Hero'}
                                </button>
                            </div>
                            <div className="absolute top-3 left-3 bg-slate-900/70 backdrop-blur text-[9px] font-black px-2 py-1 rounded-lg text-emerald-400 border border-slate-700/60">
                                #1 Hero
                            </div>
                        </div>
                    ) : imageLoading ? (
                        <div className="rounded-[2rem] bg-slate-800/60 border border-slate-700/40 w-full aspect-video flex flex-col items-center justify-center gap-3">
                            <div className="w-10 h-10 rounded-full border-2 border-slate-600 border-t-amber-400 animate-spin" />
                            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Hero afbeelding genereren…</span>
                        </div>
                    ) : null}

                </div>
            )}

            {/* Blog content */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200/80 shadow-xl overflow-hidden flex flex-col">
                <div className="bg-slate-50/80 border-b border-slate-200/60 px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-black px-3 py-1.5 ${BRAND_CONFIG[selectedBrand].color} text-white rounded-lg uppercase tracking-widest`}>{selectedBrand}</span>
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Shopify</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={memorize}
                            disabled={memorized}
                            className={`cursor-pointer flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 ${memorized
                                ? 'bg-emerald-50 text-emerald-600 cursor-default border border-emerald-200'
                                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                                }`}
                        >
                            <Brain size={14} className={memorized ? 'text-emerald-500' : ''} />
                            {memorized ? 'Onthouden' : 'Onthouden'}
                        </button>
                        <button
                            onClick={copyToClipboard}
                            className="cursor-pointer flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-900 text-white hover:bg-black transition-all active:scale-95"
                        >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            {copied ? 'Gekopieerd!' : 'Kopieer Blog'}
                        </button>
                        {published ? (
                            <a href={published} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-600 text-white hover:bg-emerald-700 transition-all">
                                <Check size={14} /> Gepubliceerd →
                            </a>
                        ) : (
                            <button
                                onClick={handlePublish}
                                disabled={publishing}
                                className="cursor-pointer flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#274472] text-white hover:bg-[#1e3660] transition-all active:scale-95 disabled:opacity-50"
                            >
                                <Send size={14} />
                                {publishing ? 'Publiceren…' : 'Publiceer naar Shopify'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-10 lg:p-12 overflow-y-auto max-h-[1200px] bg-white text-slate-800">
                    <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2 leading-tight" style={{fontFamily: "'Lora', Georgia, serif"}}>
                        {blog.title}
                    </h1>
                    <div className="flex items-center gap-2 text-slate-300 text-xs font-medium mb-8 pb-6 border-b border-slate-100">
                        <Calendar size={13} />
                        {new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <p className="text-base font-medium leading-relaxed mb-6 text-slate-600 italic">{blog.introduction}</p>

                    <div className="text-base font-normal blog-content">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                h2: ({ node, ...props }) => <h2 className={`text-xl font-bold mt-8 mb-2 ${BRAND_CONFIG[selectedBrand].accent}`} style={{fontFamily: "'Lora', Georgia, serif"}} {...props} />,
                                h3: ({ node, ...props }) => <h3 className="text-lg font-semibold mt-6 mb-2 text-slate-800" {...props} />,
                                p: ({ node, ...props }) => <p className="mb-4 leading-relaxed text-slate-700" {...props} />,
                                a: ({ node, ...props }) => <a className={`${BRAND_CONFIG[selectedBrand].accent} underline font-semibold`} target="_blank" rel="noopener noreferrer" {...props} />,
                                ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4 space-y-2" {...props} />,
                                li: ({ node, ...props }) => <li className="text-slate-700" {...props} />,
                                strong: ({ node, ...props }) => <strong className="font-bold text-slate-900" {...props} />
                            }}
                        >
                            {blog.body.replace(/\!\[.*?\]\(.*?\)/g, '')}
                        </ReactMarkdown>
                    </div>

                    <div className="mt-12 pt-8 border-t border-slate-100">
                        <h3 className={`text-xl font-bold mb-4 ${BRAND_CONFIG[selectedBrand].accent}`} style={{fontFamily: "'Lora', Georgia, serif"}}>Conclusie</h3>
                        <p className="leading-relaxed text-slate-700">{blog.conclusion}</p>
                    </div>
                </div>
            </div>

            {/* SEO Meta */}
            <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-8 shadow-lg">
                <h3 className="text-[10px] font-black uppercase tracking-[0.25em] mb-7 text-slate-400 flex items-center gap-2">
                    <ExternalLink size={13} /> Shopify SEO Meta
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meta Title</span>
                                <span className={`text-[10px] font-black uppercase tabular-nums ${seoStatus.titleLength > 60 ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {seoStatus.titleLength} / 60
                                </span>
                            </div>
                            <div className="p-3.5 bg-slate-50 rounded-xl text-xs font-medium text-slate-600 border border-slate-100 truncate">{blog.metaTitle}</div>
                        </div>
                        <div className="space-y-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">URL Handle</span>
                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 truncate">
                                <code className="text-xs text-[#688662] font-mono">{blog.urlSlug}</code>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meta Description</span>
                                <span className={`text-[10px] font-black uppercase tabular-nums ${seoStatus.descriptionLength > 160 ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {seoStatus.descriptionLength} / 160
                                </span>
                            </div>
                            <div className="p-3.5 bg-slate-50 rounded-xl text-xs font-medium text-slate-600 border border-slate-100 min-h-[80px]">{blog.metaDescription}</div>
                        </div>

                        <div className="p-4 bg-slate-900 rounded-2xl space-y-2.5">
                            <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">SEO Checklist</h4>
                            {[
                                { ok: seoStatus.hasKeywordInTitle, label: 'Zoekwoord in Titel' },
                                { ok: seoStatus.hasKeywordInIntro, label: 'Zoekwoord in Intro' },
                                { ok: seoStatus.hasKeywordInH2, label: 'Zoekwoord in H2' },
                            ].map(({ ok, label }) => (
                                <div key={label} className="flex items-center gap-2 text-[10px] font-semibold">
                                    {ok
                                        ? <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
                                        : <AlertCircle size={13} className="text-slate-600 shrink-0" />
                                    }
                                    <span className={ok ? 'text-white' : 'text-slate-500'}>{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default BlogDisplay;
