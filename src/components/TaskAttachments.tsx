import React, { useState } from 'react';
import { api } from '~/utils/api';
import FileUpload from './FileUpload';

interface TaskAttachment {
    id: string;
    filename: string;
    fileUrl: string;
    fileSize?: number | null;
    mimeType?: string | null;
    uploadedAt: Date;
}

interface TaskAttachmentsProps {
    taskId: string;
    attachments: TaskAttachment[];
}

const TaskAttachments: React.FC<TaskAttachmentsProps> = ({ taskId, attachments }) => {
    const [isUploading, setIsUploading] = useState(false);

    const utils = api.useUtils();

    const addAttachmentMutation = api.task.addAttachment.useMutation({
        onSuccess: () => {
            setIsUploading(false);
            // Refetch task data to update attachments
            void utils.task.getById.invalidate({ id: taskId });
        },
        onError: (error) => {
            console.error('Error adding attachment:', error);
            setIsUploading(false);
        },
    });

    const removeAttachmentMutation = api.task.removeAttachment.useMutation({
        onSuccess: () => {
            // Refetch task data to update attachments
            void utils.task.getById.invalidate({ id: taskId });
        },
        onError: (error) => {
            console.error('Error removing attachment:', error);
        },
    });

    const handleFileUpload = async (fileData: {
        url: string;
        filename: string;
        size?: number;
        mimeType?: string;
    }) => {
        setIsUploading(true);
        addAttachmentMutation.mutate({
            taskId,
            filename: fileData.filename,
            fileUrl: fileData.url,
            fileSize: fileData.size,
            mimeType: fileData.mimeType,
        });
    };

    const handleRemoveAttachment = (attachmentId: string) => {
        if (confirm('Are you sure you want to remove this attachment?')) {
            removeAttachmentMutation.mutate({ attachmentId });
        }
    };

    const formatFileSize = (size: number | null | undefined) => {
        if (!size) return '';
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
        return `${Math.round(size / (1024 * 1024))} MB`;
    };

    const getFileIcon = (mimeType: string | null | undefined) => {
        if (!mimeType) return '📄';

        if (mimeType.startsWith('image/')) return '🖼️';
        if (mimeType.includes('pdf')) return '📄';
        if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
        if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
        if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📈';
        if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return '🗜️';
        if (mimeType.startsWith('text/')) return '📝';

        return '📄';
    };

    return (
        <div className="space-y-4">
            {/* Upload Section */}
            <div className="border border-border rounded-lg p-4">
                <h3 className="font-medium text-foreground mb-3">Add Attachment</h3>
                <FileUpload
                    onFileUpload={handleFileUpload}
                    disabled={isUploading}
                    buttonText={isUploading ? "Uploading..." : "Choose File"}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z,.jpg,.jpeg,.png,.gif,.webp,.svg"
                    maxSize={10}
                />
                <p className="text-xs text-muted-foreground mt-2">
                    Supported: Documents (PDF, Word, Excel, PowerPoint), Images, Text files, Archives. Max 10MB.
                </p>
            </div>

            {/* Attachments List */}
            {attachments && attachments.length > 0 ? (
                <div className="space-y-3">
                    {attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-center space-x-3">
                                <span className="text-2xl">{getFileIcon(attachment.mimeType)}</span>
                                <div>
                                    <p className="font-medium text-foreground">{attachment.filename}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {formatFileSize(attachment.fileSize)}
                                        {attachment.uploadedAt && ` • ${new Date(attachment.uploadedAt).toLocaleDateString()}`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <a
                                    href={attachment.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-ghost text-sm"
                                >
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Download
                                </a>
                                <button
                                    onClick={() => handleRemoveAttachment(attachment.id)}
                                    disabled={removeAttachmentMutation.isPending}
                                    className="btn btn-ghost text-sm text-red-600 hover:text-red-700"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    {removeAttachmentMutation.isPending ? 'Removing...' : 'Remove'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-muted-foreground">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <p>No attachments yet</p>
                    <p className="text-sm mt-1">Upload files to share with your team</p>
                </div>
            )}
        </div>
    );
};

export default TaskAttachments;
