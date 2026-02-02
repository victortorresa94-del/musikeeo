import { useState, useRef, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { cn } from '../../lib/utils';
import { CITIES } from '../../lib/constants';

interface CityAutocompleteProps {
    value: string | null;
    onChange: (city: string | null) => void;
    placeholder?: string;
    className?: string;
}

export const CityAutocomplete = ({
    value,
    onChange,
    placeholder = 'Ciudad...',
    className
}: CityAutocompleteProps) => {
    const [inputValue, setInputValue] = useState(value || '');
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Filter cities based on input
    const filteredCities = inputValue.trim()
        ? CITIES.filter(city =>
            city.toLowerCase().includes(inputValue.toLowerCase())
        ).slice(0, 8) // Limit to 8 suggestions
        : [];

    // Sync external value changes
    useEffect(() => {
        setInputValue(value || '');
    }, [value]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        setIsOpen(true);
        setHighlightedIndex(-1);

        // Clear selection if input doesn't match any city exactly
        if (!CITIES.some(city => city.toLowerCase() === newValue.toLowerCase())) {
            onChange(newValue || null);
        }
    };

    const handleSelect = (city: string) => {
        setInputValue(city);
        onChange(city);
        setIsOpen(false);
        setHighlightedIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen || filteredCities.length === 0) {
            if (e.key === 'ArrowDown' && filteredCities.length > 0) {
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < filteredCities.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev > 0 ? prev - 1 : filteredCities.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0) {
                    handleSelect(filteredCities[highlightedIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setHighlightedIndex(-1);
                break;
        }
    };

    const handleBlur = () => {
        // Delay to allow click on dropdown item
        setTimeout(() => {
            if (!containerRef.current?.contains(document.activeElement)) {
                setIsOpen(false);
            }
        }, 150);
    };

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
                ref={inputRef}
                className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-500"
                type="text"
                placeholder={placeholder}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => inputValue && setIsOpen(true)}
                onBlur={handleBlur}
                autoComplete="off"
            />

            {/* Dropdown */}
            {isOpen && filteredCities.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface border border-white/10 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {filteredCities.map((city, index) => (
                        <button
                            key={city}
                            type="button"
                            className={cn(
                                "w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-2",
                                highlightedIndex === index
                                    ? "bg-primary/20 text-primary"
                                    : "text-white hover:bg-white/5"
                            )}
                            onClick={() => handleSelect(city)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                        >
                            <MapPin size={14} className="text-gray-500" />
                            <span>{city}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* No results message */}
            {isOpen && inputValue.length >= 2 && filteredCities.length === 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface border border-white/10 rounded-lg shadow-xl p-3">
                    <p className="text-sm text-gray-400 text-center">
                        No se encontró "{inputValue}"
                    </p>
                </div>
            )}
        </div>
    );
};
