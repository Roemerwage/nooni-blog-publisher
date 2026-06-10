
import React from 'react';
import { Leaf } from 'lucide-react';

const Header: React.FC = () => {
    return (
        <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200/70 sticky top-0 z-20 shadow-sm">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-[60px] flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#274472] text-white shadow-md">
                        <Leaf size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                        <div className="flex items-baseline gap-2">
                            <span className="font-semibold text-[16px] leading-none text-slate-900" style={{fontFamily: "'Lora', Georgia, serif"}}>Nooni</span>
                            <span className="text-[13px] font-medium text-slate-400 leading-none">SEO Writer</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="w-[7px] h-[7px] rounded-full bg-[#E4CFBB]" title="Coffee" />
                            <span className="w-[7px] h-[7px] rounded-full bg-[#688662]" title="Matcha" />
                            <span className="w-[7px] h-[7px] rounded-full bg-[#274472]" title="Cacao" />
                        </div>
                    </div>
                </div>

                <a
                    href="https://getnooni.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-slate-400 hover:text-[#274472] uppercase tracking-widest transition-colors cursor-pointer"
                >
                    getnooni.com ↗
                </a>
            </div>
        </header>
    );
};

export default Header;
