
import React, { useState, useEffect } from 'react';
import { FileText, Loader2, Send, ShoppingBag, Check, History, ExternalLink as ExtIcon, ChevronDown, ChevronUp, Search, Upload, PenLine, AlertCircle } from 'lucide-react';
import { Brand } from '../types';
import { BRAND_CONFIG } from '../constants';
import { getMemory, togglePosted, MemorizedBlog } from '../services/memoryService';
import keywordsData from '../data/keywords.json';

interface Keyword {
    title: string;
    intent: string;
    priority: string;
}

interface Cluster {
    name: string;
    color: string;
    keywords: Keyword[];
}

interface SidebarProps {
    selectedBrand: Brand;
    title: string;
    setTitle: (title: string) => void;
    extraContext: string;
    setExtraContext: (topics: string) => void;
    loading: boolean;
    handleGenerate: () => void;
    error: string | null;
}

const clusters: Cluster[] = keywordsData.clusters as Cluster[];

const Sidebar: React.FC<SidebarProps> = ({
    selectedBrand,
    title,
    setTitle,
    extraContext,
    setExtraContext,
    loading,
    handleGenerate,
    error
}) => {
    const [history, setHistory] = useState<MemorizedBlog[]>([]);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [activeCluster, setActiveCluster] = useState(0);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            const data = await getMemory();
            const brandHistory = data.blogs
                .filter(b => b.brand === Brand.NOONI)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 5);
            setHistory(brandHistory);
        };
        fetchHistory();
    }, [loading]);

    const writtenTitles = new Set(history.map(b => b.title));
    const postedTitles = new Set(history.filter(b => b.posted).map(b => b.title));

    const handleTogglePosted = async (blogTitle: string) => {
        await togglePosted(blogTitle);
        setHistory(prev => prev.map(b =>
            b.title === blogTitle ? { ...b, posted: !b.posted } : b
        ));
    };

    const filteredKeywords = search.trim()
        ? clusters.flatMap(c => c.keywords).filter(k =>
            k.title.toLowerCase().includes(search.toLowerCase())
          )
        : clusters[activeCluster]?.keywords ?? [];

    const handlePickKeyword = (kw: Keyword) => {
        setTitle(kw.title);
        setPickerOpen(false);
        setSearch('');
    };

    return (
        <section className="lg:col-span-4 space-y-5">
            <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-lg">
                <h2 className="text-[11px] font-black mb-5 flex items-center gap-2 text-slate-400 uppercase tracking-[0.2em]">
                    <FileText size={13} /> Blog Parameters
                </h2>
                <div className="space-y-4">

                    {/* Keyword Picker */}
                    <div>
                        <button
                            onClick={() => setPickerOpen(o => !o)}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#274472] hover:bg-white transition-all text-slate-600 cursor-pointer"
                        >
                            <span className="flex items-center gap-2 text-xs font-bold">
                                {title
                                    ? <><Check size={13} className="text-[#688662]" /> Keyword geselecteerd</>
                                    : <><Search size={13} /> Kies een keyword</>
                                }
                            </span>
                            {pickerOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                        </button>

                        {pickerOpen && (
                            <div className="mt-2 rounded-2xl border border-slate-200 overflow-hidden shadow-md">
                                {/* Search */}
                                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-100 bg-white">
                                    <Search size={13} className="text-slate-300 shrink-0" />
                                    <input
                                        autoFocus
                                        type="text"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Zoek keywords..."
                                        className="w-full text-xs bg-transparent outline-none text-slate-700 placeholder:text-slate-300"
                                    />
                                </div>

                                {/* Cluster tabs */}
                                {!search.trim() && (
                                    <div className="flex gap-1 overflow-x-auto px-2 py-2 bg-slate-50 border-b border-slate-100 scrollbar-hide">
                                        {clusters.map((c, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setActiveCluster(i)}
                                                className={`cursor-pointer shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                                    activeCluster === i
                                                        ? 'bg-[#274472] text-white'
                                                        : 'bg-white text-slate-400 border border-slate-200 hover:border-[#274472] hover:text-[#274472]'
                                                }`}
                                            >
                                                {c.name}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Keyword list */}
                                <div className="max-h-52 overflow-y-auto bg-white divide-y divide-slate-50">
                                    {filteredKeywords.map((kw, i) => {
                                        const isWritten = writtenTitles.has(kw.title);
                                        const isPosted = postedTitles.has(kw.title);
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => handlePickKeyword(kw)}
                                                className={`cursor-pointer w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors group flex items-start gap-2.5 ${isPosted ? 'opacity-40' : ''}`}
                                            >
                                                <span className={`mt-1 shrink-0 w-1.5 h-1.5 rounded-full ${kw.priority === 'high' ? 'bg-emerald-400' : kw.priority === 'medium' ? 'bg-amber-400' : 'bg-slate-200'}`} />
                                                <span className={`text-xs font-medium leading-snug flex-1 ${isPosted ? 'line-through text-slate-400' : 'text-slate-600 group-hover:text-slate-900'}`}>{kw.title}</span>
                                                {isPosted && <Upload size={11} className="shrink-0 mt-0.5 text-[#274472]" />}
                                                {isWritten && !isPosted && <PenLine size={11} className="shrink-0 mt-0.5 text-amber-400" />}
                                            </button>
                                        );
                                    })}
                                    {filteredKeywords.length === 0 && (
                                        <p className="text-xs text-slate-300 text-center py-6">Geen resultaten</p>
                                    )}
                                </div>

                                <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex gap-4">
                                    <span className="text-[10px] text-slate-400 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Hoog</span>
                                    <span className="text-[10px] text-slate-400 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" /> Medium</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Title input */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Blog Titel</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Voer hier de exacte titel van je blog in..."
                            className="w-full px-4 py-3.5 rounded-xl bg-slate-900 text-white border-2 border-slate-800 focus:border-slate-600 focus:ring-0 outline-none transition-all placeholder:text-slate-600 text-sm font-medium"
                        />
                    </div>

                    {/* Extra context */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Extra Context <span className="text-slate-600 normal-case font-medium">(optioneel)</span></label>
                        <textarea
                            value={extraContext}
                            onChange={(e) => setExtraContext(e.target.value)}
                            placeholder="Plak hier extra informatie of een tekst waar de AI van kan leren. Dit is een uitbreiding op de titel."
                            rows={5}
                            className="w-full px-4 py-3.5 rounded-xl bg-slate-900 text-white border-2 border-slate-800 focus:border-slate-600 focus:ring-0 outline-none transition-all resize-none placeholder:text-slate-600 text-sm font-medium"
                        />
                    </div>

                    {error && (
                        <div className="p-3.5 bg-red-50 text-red-600 rounded-xl text-xs font-semibold border border-red-100 flex items-start gap-2">
                            <AlertCircle size={14} className="shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className={`w-full py-4 rounded-2xl text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 active:scale-95 shadow-lg hover:shadow-[0_12px_40px_rgba(39,68,114,0.4)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg ${BRAND_CONFIG[selectedBrand].color} ${BRAND_CONFIG[selectedBrand].hoverColor}`}
                    >
                        {loading ? <><Loader2 size={16} className="animate-spin" /> Schrijven...</> : <><Send size={16} /> Blog Genereren</>}
                    </button>
                </div>
            </div>

            {/* History */}
            <div className="bg-slate-900 text-white p-7 rounded-3xl shadow-xl border border-slate-800/50">
                <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-5 flex items-center gap-2">
                    <History size={13} /> Recent Onthouden
                </h3>

                <div className="space-y-4">
                    {history.length > 0 ? (
                        history.map((item, idx) => (
                            <div key={idx} className="group">
                                <div className="flex items-start justify-between gap-2">
                                    <h4 className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors line-clamp-1 flex-1">{item.title}</h4>
                                    <button
                                        onClick={() => handleTogglePosted(item.title)}
                                        title={item.posted ? 'Markeer als niet gepost' : 'Markeer als gepost'}
                                        className={`cursor-pointer shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all border ${
                                            item.posted
                                                ? 'bg-[#274472] border-[#274472] text-white'
                                                : 'border-slate-700 text-slate-600 hover:border-slate-500 hover:text-slate-400'
                                        }`}
                                    >
                                        <Upload size={9} />
                                        {item.posted ? 'Gepost' : 'Post'}
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-slate-600 font-medium">
                                        {new Date(item.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                                    </span>
                                    <span className="text-slate-700">·</span>
                                    <code className="text-[10px] text-[#688662]/80 font-mono truncate max-w-[150px]">{item.urlSlug}</code>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-[10px] text-slate-700 font-medium text-center py-4">Nog geen geschiedenis</p>
                    )}
                </div>

                <div className="mt-7 pt-5 border-t border-slate-800/50 space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-3 flex items-center gap-2">
                        <ShoppingBag size={13} /> Catalogus & SEO
                    </h3>
                    <div className="space-y-2.5">
                        <div className="flex items-center gap-3 text-xs font-medium text-slate-500"><Check size={13} className="text-emerald-500 shrink-0" /><span>Geen witregel na tussenkop</span></div>
                        <div className="flex items-center gap-3 text-xs font-medium text-slate-500"><Check size={13} className="text-emerald-500 shrink-0" /><span>Focus op titel-keywords</span></div>
                    </div>
                    <a href={BRAND_CONFIG[selectedBrand].catalogUrl} target="_blank" rel="noopener noreferrer" className="cursor-pointer flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors group mt-3">
                        Live Catalogus <ExtIcon size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </a>
                </div>
            </div>
        </section>
    );
};

export default Sidebar;
