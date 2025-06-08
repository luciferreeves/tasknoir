import React, { useState } from 'react';
import { api } from '~/utils/api';
import { useSession } from 'next-auth/react';
import UserAvatar from './UserAvatar';
import MarkdownPreview from './MarkdownPreview';
import { default as WysiwygEditor } from './WysiwygEditor';
import FileUpload from './FileUpload';
import { Edit2, Trash2, X, Check } from 'lucide-react';

interface TaskCommentsProps {
    taskId: string;
    comments: TaskComment[];
}

interface TaskComment {
    id: string;
    content: string;
    user: {
        id: string;
        name: string;
        email: string;
        image?: string | null;
    };
    createdAt: Date;
}

const TaskComments: React.FC<TaskCommentsProps> = ({ taskId, comments }) => {
    const { data: session } = useSession();
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingContent, setEditingContent] = useState('');
    const [attachments, setAttachments] = useState<Array<{
        url: string;
        filename: string;
        size?: number;
        mimeType?: string;
    }>>([]);

    const utils = api.useUtils();

    const addCommentMutation = api.task.addComment.useMutation({
        onSuccess: () => {
            setNewComment('');
            setAttachments([]);
            setIsSubmitting(false);
            // Refetch task data to update comments
            void utils.task.getById.invalidate({ id: taskId });
        },
        onError: (error) => {
            console.error('Error adding comment:', error);
            setIsSubmitting(false);
        },
    });

    const addAttachmentMutation = api.task.addAttachment.useMutation({
        onError: (error) => {
            console.error('Error adding attachment:', error);
        },
    });

    const updateCommentMutation = api.task.updateComment.useMutation({
        onSuccess: () => {
            setEditingCommentId(null);
            setEditingContent('');
            void utils.task.getById.invalidate({ id: taskId });
        },
        onError: (error) => {
            console.error('Error updating comment:', error);
        },
    });

    const deleteCommentMutation = api.task.deleteComment.useMutation({
        onSuccess: () => {
            void utils.task.getById.invalidate({ id: taskId });
        },
        onError: (error) => {
            console.error('Error deleting comment:', error);
        },
    });

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting || (!newComment.trim() && attachments.length === 0)) return;

        setIsSubmitting(true);

        try {
            // Add comment first
            let commentContent = newComment.trim();

            // Extract images from comment content and add to attachments
            const imageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/g;
            const extractedImages: Array<{
                url: string;
                filename: string;
                mimeType: string;
                size?: number;
            }> = [];

            let match;
            while ((match = imageRegex.exec(commentContent)) !== null) {
                const url = match[1];
                if (url) {
                    const filename = url.split('/').pop() ?? 'image';
                    extractedImages.push({
                        url,
                        filename,
                        mimeType: 'image/jpeg', // Default, will be corrected by server
                    });
                }
            }

            // Combine regular attachments with extracted images
            const allAttachments = [...attachments, ...extractedImages];

            // If we have attachments, add them to the comment content
            if (attachments.length > 0) {
                const attachmentLinks = attachments.map(att =>
                    `\n\n**Attachment:** [${att.filename}](${att.url})`
                ).join('');
                commentContent += attachmentLinks;
            }

            // Submit the comment
            const comment = await addCommentMutation.mutateAsync({
                taskId,
                content: commentContent || 'File attachment',
            });

            // Add all attachments to task only if comment was created successfully
            if (comment?.id && allAttachments.length > 0) {
                try {
                    for (const attachment of allAttachments) {
                        await addAttachmentMutation.mutateAsync({
                            taskId,
                            filename: attachment.filename,
                            fileUrl: attachment.url,
                            fileSize: attachment.size,
                            mimeType: attachment.mimeType,
                        });
                    }
                } catch (attachmentError) {
                    console.error('Error adding attachments:', attachmentError);
                    // Don't fail the whole operation if attachments fail
                }
            }
        } catch (error) {
            console.error('Error submitting comment:', error);
            setIsSubmitting(false);
        }
    };

    const handleFileUpload = (fileData: {
        url: string;
        filename: string;
        size?: number;
        mimeType?: string;
    }) => {
        setAttachments(prev => [...prev, fileData]);
    };

    const handleImageUpload = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload/file', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Image upload failed');
        }

        const result = await response.json() as {
            url: string;
            filename: string;
            size?: number;
            mimeType?: string;
        };

        // Don't add to attachments here since the editor handles it
        return result.url;
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleEditComment = (commentId: string, currentContent: string) => {
        setEditingCommentId(commentId);
        setEditingContent(currentContent);
    };

    const handleCancelEdit = () => {
        setEditingCommentId(null);
        setEditingContent('');
    };

    const handleSaveEdit = async () => {
        if (!editingCommentId || !editingContent.trim()) return;

        try {
            await updateCommentMutation.mutateAsync({
                commentId: editingCommentId,
                content: editingContent,
            });
        } catch (error) {
            console.error('Error saving edit:', error);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('Are you sure you want to delete this comment?')) return;

        try {
            await deleteCommentMutation.mutateAsync({ commentId });
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Add Comment Form */}
            <form onSubmit={handleSubmitComment} className="space-y-4">
                <div>
                    <label className="label mb-2 block">Add Comment</label>
                    <WysiwygEditor
                        content={newComment}
                        onChange={(value) => setNewComment(value)}
                        placeholder="Write your comment..."
                        height={150}
                        onImageUpload={handleImageUpload}
                    />
                </div>

                {/* File Attachments */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-foreground">Attachments</label>
                        <FileUpload
                            onFileUpload={handleFileUpload}
                            buttonText="Add File"
                            disabled={isSubmitting}
                        />
                    </div>

                    {attachments.length > 0 && (
                        <div className="space-y-2">
                            {attachments.map((attachment, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded border">
                                    <div className="flex items-center space-x-2">
                                        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                        </svg>
                                        <span className="text-sm text-foreground">{attachment.filename}</span>
                                        {attachment.size && (
                                            <span className="text-xs text-muted-foreground">
                                                ({Math.round(attachment.size / 1024)} KB)
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeAttachment(index)}
                                        className="text-red-500 hover:text-red-700"
                                        title="Remove attachment"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isSubmitting || (!newComment.trim() && attachments.length === 0)}
                        className="btn btn-primary"
                    >
                        {isSubmitting ? 'Adding...' : 'Add Comment'}
                    </button>
                </div>
            </form>

            {/* Comments List */}
            {comments && comments.length > 0 ? (
                <div className="space-y-4">
                    {comments.map((comment) => (
                        <div key={comment.id} className="border-l-4 border-primary/30 pl-4 py-2">
                            <div className="flex items-center justify-between mb-3">
                                <UserAvatar
                                    user={{
                                        id: comment.user.id,
                                        name: comment.user.name,
                                        email: comment.user.email,
                                        image: comment.user.image
                                    }}
                                    size="sm"
                                    clickable={true}
                                    showName={true}
                                />
                                <span className="text-sm text-muted-foreground">
                                    {formatDate(comment.createdAt)}
                                </span>
                            </div>
                            {editingCommentId === comment.id ? (
                                <div className="space-y-4">
                                    {/* Edit Comment */}
                                    <div>
                                        <WysiwygEditor
                                            content={editingContent}
                                            onChange={(value) => setEditingContent(value)}
                                            placeholder="Edit your comment..."
                                            height={100}
                                            onImageUpload={handleImageUpload}
                                        />
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                        <button
                                            onClick={handleSaveEdit}
                                            className="btn btn-primary"
                                        >
                                            <Check className="w-4 h-4 mr-2" />
                                            Save
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            className="btn btn-secondary"
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <MarkdownPreview content={comment.content} />
                                    {(session?.user.id === comment.user.id || session?.user.role === "ADMIN") && (
                                        <div className="flex space-x-2 mt-2">
                                            {session?.user.id === comment.user.id && (
                                                <button
                                                    onClick={() => handleEditComment(comment.id, comment.content)}
                                                    className="text-blue-500 hover:underline text-sm"
                                                    title="Edit comment"
                                                >
                                                    <Edit2 className="w-4 h-4 mr-1 inline" />
                                                    Edit
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDeleteComment(comment.id)}
                                                className="text-red-500 hover:underline text-sm"
                                                title="Delete comment"
                                            >
                                                <Trash2 className="w-4 h-4 mr-1 inline" />
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <p className="text-muted-foreground">No comments yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        Be the first to leave a comment!
                    </p>
                </div>
            )}
        </div>
    );
};

export default TaskComments;
