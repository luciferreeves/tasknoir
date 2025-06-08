import React, { useState, useEffect, useRef } from 'react';
import { api } from '~/utils/api';
import { X } from 'lucide-react';

interface Tag {
    id: string;
    name: string;
    color?: string | null;
}

interface TagInputProps {
    selectedTags: Tag[];
    onTagsChange: (tags: Tag[]) => void;
    placeholder?: string;
}

const TagInput: React.FC<TagInputProps> = ({
    selectedTags,
    onTagsChange,
    placeholder = "Search or create tags..."
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const { data: searchResults, isLoading: isSearching } = api.categoriesTags.searchTags.useQuery(
        { query: searchQuery, limit: 10 },
        {
            enabled: searchQuery.length >= 1,
            refetchOnWindowFocus: false,
        }
    );

    const createTagMutation = api.categoriesTags.createOrFindTag.useMutation({
        onSuccess: (newTag) => {
            if (!selectedTags.find(tag => tag.id === newTag.id)) {
                onTagsChange([...selectedTags, newTag]);
            }
            setSearchQuery('');
            setShowSuggestions(false);
            setIsCreating(false);
        },
        onError: (error) => {
            console.error('Error creating tag:', error);
            setIsCreating(false);
        },
    });

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);
        setShowSuggestions(value.length > 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();

            if (searchQuery.trim()) {
                // Check if exact match exists in search results
                const exactMatch = searchResults?.find(
                    tag => tag.name.toLowerCase() === searchQuery.trim().toLowerCase()
                );

                if (exactMatch) {
                    selectTag(exactMatch);
                } else {
                    // Create new tag
                    void createNewTag(searchQuery.trim());
                }
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
            setSearchQuery('');
        }
    };

    const selectTag = (tag: Tag) => {
        if (!selectedTags.find(selectedTag => selectedTag.id === tag.id)) {
            onTagsChange([...selectedTags, tag]);
        }
        setSearchQuery('');
        setShowSuggestions(false);
    };

    const removeTag = (tagToRemove: Tag) => {
        onTagsChange(selectedTags.filter(tag => tag.id !== tagToRemove.id));
    };

    const createNewTag = async (name: string) => {
        if (isCreating) return;

        setIsCreating(true);
        void createTagMutation.mutate({ name });
    };

    const filteredResults = searchResults?.filter(
        tag => !selectedTags.find(selectedTag => selectedTag.id === tag.id)
    ) ?? [];

    const showCreateOption = searchQuery.trim() &&
        !filteredResults.find(tag => tag.name.toLowerCase() === searchQuery.trim().toLowerCase());

    return (
        <div className="space-y-2">
            {/* Selected Tags */}
            {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag) => (
                        <span
                            key={tag.id}
                            className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                            style={{
                                backgroundColor: tag.color ? `${tag.color}20` : undefined,
                                color: tag.color ?? undefined,
                            }}
                        >
                            {tag.name}
                            <button
                                onClick={() => removeTag(tag)}
                                className="ml-2 hover:text-primary/70"
                                type="button"
                                title="Remove tag"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Input Container */}
            <div ref={containerRef} className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowSuggestions(searchQuery.length > 0)}
                    placeholder={placeholder}
                    className="input w-full"
                />

                {/* Suggestions Dropdown */}
                {showSuggestions && (
                    <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto backdrop-blur-sm">
                        {isSearching ? (
                            <div className="p-3 text-sm text-muted-foreground bg-background">
                                Searching...
                            </div>
                        ) : (
                            <>
                                {/* Existing tags */}
                                {filteredResults.map((tag) => (
                                    <button
                                        key={tag.id}
                                        onClick={() => selectTag(tag)}
                                        className="w-full text-left px-3 py-2 hover:bg-muted transition-colors bg-background"
                                        type="button"
                                    >
                                        <span
                                            className="inline-block w-3 h-3 rounded-full mr-2"
                                            style={{ backgroundColor: tag.color ?? '#6b7280' }}
                                        />
                                        {tag.name}
                                    </button>
                                ))}

                                {/* Create new tag option */}
                                {showCreateOption && (
                                    <button
                                        onClick={() => createNewTag(searchQuery.trim())}
                                        disabled={isCreating}
                                        className="w-full text-left px-3 py-2 hover:bg-muted transition-colors text-primary disabled:opacity-50 bg-background"
                                        type="button"
                                    >
                                        {isCreating ? (
                                            <>Creating &ldquo;{searchQuery.trim()}&rdquo;...</>
                                        ) : (
                                            <>Create &ldquo;{searchQuery.trim()}&rdquo;</>
                                        )}
                                    </button>
                                )}

                                {/* No results */}
                                {filteredResults.length === 0 && !showCreateOption && (
                                    <div className="p-3 text-sm text-muted-foreground bg-background">
                                        No tags found
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TagInput;
