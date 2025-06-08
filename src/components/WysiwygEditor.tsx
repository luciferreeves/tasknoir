import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { useTheme } from 'next-themes';
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Quote,
    Code,
    Link as LinkIcon,
    Image as ImageIcon,
    Undo,
    Redo,
    Type,
    CheckSquare,
} from 'lucide-react';

interface WysiwygEditorProps {
    content?: string;
    onChange: (content: string) => void;
    placeholder?: string;
    height?: number;
    onImageUpload?: (file: File) => Promise<string>;
    editable?: boolean;
    projectId?: string;
}

const WysiwygEditor: React.FC<WysiwygEditorProps> = ({
    content = '',
    onChange,
    placeholder = 'Start typing...',
    height = 200,
    onImageUpload,
    editable = true,
}) => {
    const { theme, systemTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3, 4, 5, 6],
                    HTMLAttributes: {
                        class: 'font-bold text-foreground',
                    },
                },
                paragraph: {
                    HTMLAttributes: {
                        class: 'text-foreground leading-7',
                    },
                },
                bulletList: {
                    HTMLAttributes: {
                        class: 'ml-6 list-disc text-foreground',
                    },
                },
                orderedList: {
                    HTMLAttributes: {
                        class: 'ml-6 list-decimal text-foreground',
                    },
                },
                listItem: {
                    HTMLAttributes: {
                        class: 'text-foreground',
                    },
                },
                blockquote: {
                    HTMLAttributes: {
                        class: 'border-l-2 border-border pl-6 italic text-muted-foreground',
                    },
                },
                code: {
                    HTMLAttributes: {
                        class: 'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-foreground',
                    },
                },
                codeBlock: {
                    HTMLAttributes: {
                        class: 'relative rounded bg-muted px-4 py-3 font-mono text-sm text-foreground overflow-x-auto',
                    },
                },
                horizontalRule: {
                    HTMLAttributes: {
                        class: 'my-4 border-t border-border',
                    },
                },
                bold: {
                    HTMLAttributes: {
                        class: 'font-bold',
                    },
                },
                italic: {
                    HTMLAttributes: {
                        class: 'italic',
                    },
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary hover:text-primary/80 underline underline-offset-4',
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'max-w-full h-auto rounded-lg border border-border',
                },
            }),
            TaskList.configure({
                HTMLAttributes: {
                    class: 'not-prose pl-2',
                },
            }),
            TaskItem.configure({
                nested: true,
                HTMLAttributes: {
                    class: 'flex gap-2 items-start',
                },
            }),
        ],
        content,
        editable,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: `focus:outline-none p-4 text-foreground min-h-0`,
                style: `min-height: ${height}px;`,
            },
        },
    });

    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    const addImage = async () => {
        if (!onImageUpload) {
            const url = window.prompt('Enter image URL:');
            if (url) {
                editor?.chain().focus().setImage({ src: url }).run();
            }
            return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                try {
                    const url = await onImageUpload(file);
                    editor?.chain().focus().setImage({ src: url }).run();
                } catch (error) {
                    console.error('Image upload failed:', error);
                }
            }
        };
        input.click();
    };

    const addLink = () => {
        const previousUrl = editor?.getAttributes('link').href as string | undefined;
        const url = window.prompt('URL:', previousUrl ?? '');

        if (url === null) {
            return;
        }

        if (url === '') {
            editor?.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    if (!mounted) {
        return (
            <div
                className="w-full border border-border rounded-lg bg-background animate-pulse"
                style={{ height: height + 50 }}
            />
        );
    }

    if (!editor) {
        return null;
    }

    const currentTheme = theme === "system" ? systemTheme : theme;
    const isDark = currentTheme === "dark";

    return (
        <div className={`border border-border rounded-lg bg-background ${isDark ? 'dark' : ''}`}>
            {editable && (
                <div className="border-b border-border p-2 flex flex-wrap gap-1">
                    <button
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        disabled={!editor.can().chain().focus().toggleBold().run()}
                        className={`p-2 rounded hover:bg-muted transition-colors ${editor.isActive('bold') ? 'bg-muted' : ''
                            }`}
                        type="button"
                        aria-label="Bold"
                        title="Bold"
                    >
                        <Bold className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        disabled={!editor.can().chain().focus().toggleItalic().run()}
                        className={`p-2 rounded hover:bg-muted transition-colors ${editor.isActive('italic') ? 'bg-muted' : ''
                            }`}
                        type="button"
                        aria-label="Italic"
                        title="Italic"
                    >
                        <Italic className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleCode().run()}
                        disabled={!editor.can().chain().focus().toggleCode().run()}
                        className={`p-2 rounded hover:bg-muted transition-colors ${editor.isActive('code') ? 'bg-muted' : ''
                            }`}
                        type="button"
                        aria-label="Inline Code"
                        title="Inline Code"
                    >
                        <Code className="h-4 w-4" />
                    </button>

                    <div className="w-px bg-border mx-1" />

                    <button
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        className={`p-2 rounded hover:bg-muted transition-colors text-sm font-bold ${editor.isActive('heading', { level: 1 }) ? 'bg-muted' : ''
                            }`}
                        type="button"
                        aria-label="Heading 1"
                        title="Heading 1"
                    >
                        H1
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={`p-2 rounded hover:bg-muted transition-colors text-sm font-bold ${editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''
                            }`}
                        type="button"
                        aria-label="Heading 2"
                        title="Heading 2"
                    >
                        H2
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        className={`p-2 rounded hover:bg-muted transition-colors text-sm font-bold ${editor.isActive('heading', { level: 3 }) ? 'bg-muted' : ''
                            }`}
                        type="button"
                        aria-label="Heading 3"
                        title="Heading 3"
                    >
                        H3
                    </button>
                    <button
                        onClick={() => editor.chain().focus().setParagraph().run()}
                        className={`p-2 rounded hover:bg-muted transition-colors ${editor.isActive('paragraph') ? 'bg-muted' : ''
                            }`}
                        type="button"
                        aria-label="Paragraph"
                        title="Paragraph"
                    >
                        <Type className="h-4 w-4" />
                    </button>

                    <div className="w-px bg-border mx-1" />

                    <button
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={`p-2 rounded hover:bg-muted transition-colors ${editor.isActive('bulletList') ? 'bg-muted' : ''
                            }`}
                        type="button"
                        aria-label="Bullet List"
                        title="Bullet List"
                    >
                        <List className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className={`p-2 rounded hover:bg-muted transition-colors ${editor.isActive('orderedList') ? 'bg-muted' : ''
                            }`}
                        type="button"
                        aria-label="Numbered List"
                        title="Numbered List"
                    >
                        <ListOrdered className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleTaskList().run()}
                        className={`p-2 rounded hover:bg-muted transition-colors ${editor.isActive('taskList') ? 'bg-muted' : ''
                            }`}
                        type="button"
                        aria-label="Task List"
                        title="Task List"
                    >
                        <CheckSquare className="h-4 w-4" />
                    </button>

                    <div className="w-px bg-border mx-1" />

                    <button
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        className={`p-2 rounded hover:bg-muted transition-colors ${editor.isActive('blockquote') ? 'bg-muted' : ''
                            }`}
                        type="button"
                        aria-label="Quote"
                        title="Quote"
                    >
                        <Quote className="h-4 w-4" />
                    </button>

                    <div className="w-px bg-border mx-1" />

                    <button
                        onClick={addLink}
                        className={`p-2 rounded hover:bg-muted transition-colors ${editor.isActive('link') ? 'bg-muted' : ''
                            }`}
                        type="button"
                        aria-label="Add Link"
                        title="Add Link"
                    >
                        <LinkIcon className="h-4 w-4" />
                    </button>
                    <button
                        onClick={addImage}
                        className="p-2 rounded hover:bg-muted transition-colors"
                        type="button"
                        aria-label="Add Image"
                        title="Add Image"
                    >
                        <ImageIcon className="h-4 w-4" />
                    </button>

                    <div className="w-px bg-border mx-1" />

                    <button
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().chain().focus().undo().run()}
                        className="p-2 rounded hover:bg-muted transition-colors disabled:opacity-50"
                        type="button"
                        aria-label="Undo"
                        title="Undo"
                    >
                        <Undo className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().chain().focus().redo().run()}
                        className="p-2 rounded hover:bg-muted transition-colors disabled:opacity-50"
                        type="button"
                        aria-label="Redo"
                        title="Redo"
                    >
                        <Redo className="h-4 w-4" />
                    </button>
                </div>
            )}
            <div
                className="focus-within:outline-none"
                style={{ minHeight: height }}
            >
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};

export default WysiwygEditor;
