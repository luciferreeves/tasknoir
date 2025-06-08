import React from 'react';

interface HtmlPreviewProps {
    content: string;
    className?: string;
    maxLength?: number;
    stripHtml?: boolean;
}

const HtmlPreview: React.FC<HtmlPreviewProps> = ({
    content,
    className = '',
    maxLength = 150,
    stripHtml = true
}) => {
    if (!content || content.trim() === '') {
        return (
            <div className={`text-muted-foreground italic ${className}`}>
                No description provided
            </div>
        );
    }

    // Function to strip HTML tags and get plain text
    const stripHtmlTags = (html: string): string => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent ?? '';
    };

    // Function to truncate text
    const truncateText = (text: string, maxLen: number): string => {
        if (text.length <= maxLen) return text;
        return text.substring(0, maxLen).trim() + '...';
    };

    if (stripHtml) {
        // For previews, strip HTML and show plain text
        const plainText = stripHtmlTags(content);
        const truncatedText = truncateText(plainText, maxLength);

        return (
            <div className={className}>
                {truncatedText}
            </div>
        );
    } else {
        // For full display, render HTML safely
        return (
            <div
                className={`html-content ${className}`}
                dangerouslySetInnerHTML={{ __html: content }}
            />
        );
    }
};

export default HtmlPreview;
