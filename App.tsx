
import React, { useState } from 'react';
import { Brand, BlogContent } from './types';
import { BRAND_CONFIG } from './constants';
import { generateBlogContent } from './services/geminiService';
import { generateBlogImages } from './services/imageService';
import { marked } from 'marked';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import BlogDisplay from './components/BlogDisplay';
import { memorizeBlog } from './services/memoryService';
import { injectInternalLinks } from './services/seoUtils';

const App: React.FC = () => {
  const selectedBrand = Brand.NOONI;
  const [title, setTitle] = useState('');
  const [extraContext, setExtraContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [blog, setBlog] = useState<BlogContent | null>(null);
  const [copied, setCopied] = useState(false);
  const [memorized, setMemorized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  const handleGenerate = async () => {
    if (!title.trim()) {
      setError('Voer aanzublieft een titel of onderwerp in.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const generatedBlog = await generateBlogContent(selectedBrand, title, extraContext);

      setBlog(generatedBlog);
      setMemorized(false);

      // Generate images in background after blog is ready
      setImageLoading(true);
      generateBlogImages(generatedBlog.title, generatedBlog.body, (index, dataUrl) => {
        setBlog(prev => {
          if (!prev) return prev;
          const imgs = [...(prev.generatedImages || [])];
          imgs[index] = dataUrl;
          return { ...prev, generatedImages: imgs };
        });
      }).catch(err => {
        console.error('Image generation failed:', err);
      }).finally(() => {
        setImageLoading(false);
      });
    } catch (err) {
      setError(`Er is iets misgegaan: ${err instanceof Error ? err.message : String(err)}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!blog) return;

    // 1. Plain Text Version (Markdown)
    const plainText = `# ${blog.title}\n\n${blog.introduction}\n\n${blog.body}\n\n## Conclusie\n${blog.conclusion}`;

    // 2. HTML Version (Rich Text)
    // We need to parse the markdown body to HTML. First strip any images the AI might have snuck in.
    const cleanBody = blog.body.replace(/\!\[.*?\]\(.*?\)/g, '');
    let bodyHtml = await marked.parse(cleanBody);

    // Convert images to Base64 to bypass localhost/https restrictions in Shopify
    const matches = [...bodyHtml.matchAll(/<img[^>]+src="([^">]+)"/g)];

    for (const m of matches) {
      const src = m[1];
      if (src.startsWith('/')) {
        try {
          const response = await fetch(src);
          const blob = await response.blob();
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          bodyHtml = bodyHtml.replace(src, base64);
        } catch (e) {
          console.error("Failed to inline image:", e);
          // Fallback to absolute localhost URL
          bodyHtml = bodyHtml.replace(src, `${window.location.origin}${src}`);
        }
      }
    }

    const fullHtml = `
      <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #334155; line-height: 1.6;">
        <h1 style="color: #0f172a; margin-bottom: 1em;">${blog.title}</h1>
        <p style="font-style: italic; margin-bottom: 2em; color: #64748b;">${blog.introduction}</p>
        ${bodyHtml}
        <h2 style="color: #0f172a; margin-top: 2em; margin-bottom: 1em;">Conclusie</h2>
        <p>${blog.conclusion}</p>
      </div>
    `;

    try {
      const clipboardItem = new ClipboardItem({
        'text/plain': new Blob([plainText], { type: 'text/plain' }),
        'text/html': new Blob([fullHtml], { type: 'text/html' })
      });
      await navigator.clipboard.write([clipboardItem]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy rich text:', err);
      // Fallback to simple text copy if rich copy fails
      navigator.clipboard.writeText(plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleMemorize = async () => {
    if (!blog) return;
    try {
      await memorizeBlog(blog, selectedBrand);
      setMemorized(true);
    } catch (err) {
      console.error('Failed to memorize:', err);
      setError('Kon de blog niet onthouden.');
    }
  };



  return (
    <div className="min-h-screen pb-12 transition-colors duration-500 font-inter" style={{background: '#f9f8f6'}}>
      <Header />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Sidebar
          selectedBrand={selectedBrand}
          title={title}
          setTitle={setTitle}
          extraContext={extraContext}
          setExtraContext={setExtraContext}
          loading={loading}
          handleGenerate={handleGenerate}
          error={error}
        />

        <BlogDisplay
          blog={blog}
          loading={loading}
          selectedBrand={selectedBrand}
          copied={copied}
          copyToClipboard={copyToClipboard}
          memorize={handleMemorize}
          memorized={memorized}
          keyword={title}
          imageLoading={imageLoading}
        />
      </main>
    </div>
  );
};

export default App;
