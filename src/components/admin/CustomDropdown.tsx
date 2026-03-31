
"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, LucideIcon } from "lucide-react";

interface Option {
    id: string;
    label: string;
    subLabel?: string;
    icon?: LucideIcon;
    badge?: string;
}

interface CustomDropdownProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    label: string;
    placeholder?: string;
    icon?: LucideIcon;
}

export function CustomDropdown({ options, value, onChange, label, placeholder = "Select an option", icon: LabelIcon }: CustomDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.id === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1.5 px-1 flex items-center gap-2">
                {LabelIcon && <LabelIcon className="w-3 h-3" />}
                {label}
            </label>
            
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-left flex items-center justify-between transition-all hover:bg-slate-900/80 hover:border-indigo-500/30 ${isOpen ? 'ring-2 ring-indigo-500/20 border-indigo-500/50' : ''}`}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    {selectedOption?.icon && <selectedOption.icon className="w-4 h-4 text-indigo-400 shrink-0" />}
                    <div className="flex flex-col truncate">
                        <span className={`font-bold transition-colors ${selectedOption ? 'text-white' : 'text-slate-600'}`}>
                            {selectedOption ? selectedOption.label : placeholder}
                        </span>
                        {selectedOption?.subLabel && (
                            <span className="text-[10px] text-slate-500 font-medium truncate">{selectedOption.subLabel}</span>
                        )}
                    </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-[110] mt-2 w-full bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {options.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => {
                                    onChange(option.id);
                                    setIsOpen(false);
                                }}
                                className={`w-full px-4 py-3 text-left flex items-center justify-between transition-all hover:bg-indigo-500/10 group ${value === option.id ? 'bg-indigo-500/10' : ''}`}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    {option.icon && <option.icon className={`w-4 h-4 shrink-0 ${value === option.id ? 'text-indigo-400' : 'text-slate-500 group-hover:text-indigo-400'}`} />}
                                    <div className="flex flex-col truncate">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-bold truncate ${value === option.id ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                                                {option.label}
                                            </span>
                                            {option.badge && (
                                                <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-[8px] font-black text-indigo-400 border border-indigo-500/20 uppercase tracking-tighter">
                                                    {option.badge}
                                                </span>
                                            )}
                                        </div>
                                        {option.subLabel && (
                                            <span className="text-[10px] text-slate-500 font-medium truncate">{option.subLabel}</span>
                                        )}
                                    </div>
                                </div>
                                {value === option.id && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
