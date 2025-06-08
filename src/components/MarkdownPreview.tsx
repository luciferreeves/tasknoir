import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

interface MarkdownPreviewProps {
    content: string;
    className?: string;
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content, className = '' }) => {
    if (!content || content.trim() === '') {
        return (
            <div className={`text-muted-foreground italic ${className}`}>
                No description provided
            </div>
        );
    }

    return (
        <div className={`markdown-content prose max-w-none ${className}`}>
            <ReactMarkdown
                rehypePlugins={[rehypeRaw, rehypeSanitize]}
                components={{
                    // Custom heading styles
                    h1: ({ children }) => (
                        <h1 className="text-2xl font-bold text-foreground mb-4 pb-2 border-b border-border">
                            {children}
                        </h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="text-xl font-bold text-foreground mb-3 mt-6">
                            {children}
                        </h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="text-lg font-semibold text-foreground mb-2 mt-4">
                            {children}
                        </h3>
                    ),
                    // Custom paragraph styles
                    p: ({ children }) => (
                        <p className="text-foreground mb-4 leading-relaxed">
                            {children}
                        </p>
                    ),
                    // Custom list styles
                    ul: ({ children }) => (
                        <ul className="list-disc list-inside mb-4 space-y-1 text-foreground">
                            {children}
                        </ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="list-decimal list-inside mb-4 space-y-1 text-foreground">
                            {children}
                        </ol>
                    ),
                    // Custom code styles
                    code: ({ children, className }) => {
                        const isInline = !className;
                        if (isInline) {
                            return (
                                <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono text-foreground">
                                    {children}
                                </code>
                            );
                        }
                        return (
                            <code className="block bg-muted p-4 rounded text-sm font-mono text-foreground overflow-x-auto">
                                {children}
                            </code>
                        );
                    },
                    pre: ({ children }) => (
                        <pre className="bg-muted p-4 rounded text-sm font-mono text-foreground overflow-x-auto mb-4">
                            {children}
                        </pre>
                    ),
                    // Custom blockquote styles
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-4">
                            {children}
                        </blockquote>
                    ),
                    // Custom link styles
                    a: ({ children, href }) => (
                        <a
                            href={href}
                            className="text-primary hover:text-primary/80 underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {children}
                        </a>
                    ),
                    // Custom table styles
                    table: ({ children }) => (
                        <div className="overflow-x-auto mb-4">
                            <table className="min-w-full border border-border">
                                {children}
                            </table>
                        </div>
                    ),
                    th: ({ children }) => (
                        <th className="border border-border px-4 py-2 bg-muted font-semibold text-foreground text-left">
                            {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td className="border border-border px-4 py-2 text-foreground">
                            {children}
                        </td>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownPreview;
