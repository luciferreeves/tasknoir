import React, { useState, useRef } from 'react';

// Define types for API responses
interface UploadErrorResponse {
    message?: string;
}

interface UploadSuccessResponse {
    url: string;
    filename: string;
    size?: number;
    mimeType?: string;
}

interface FileUploadProps {
    onFileUpload: (fileData: {
        url: string;
        filename: string;
        size?: number;
        mimeType?: string;
    }) => void;
    accept?: string;
    maxSize?: number; // in MB
    disabled?: boolean;
    multiple?: boolean;
    buttonText?: string;
    className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
    onFileUpload,
    accept = "*/*",
    maxSize = 10,
    disabled = false,
    multiple = false,
    buttonText = "Upload File",
    className = "",
}) => {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        if (!file) return;

        // Check file size
        if (file.size > maxSize * 1024 * 1024) {
            setError(`File size must be less than ${maxSize}MB`);
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload/file', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json() as UploadErrorResponse;
                throw new Error(errorData.message ?? 'Upload failed');
            }

            const result = await response.json() as UploadSuccessResponse;
            onFileUpload({
                url: result.url,
                filename: result.filename,
                size: result.size,
                mimeType: result.mimeType,
            });

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('File upload error:', error);
            setError(error instanceof Error ? error.message : 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className={`space-y-2 ${className}`}>
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                multiple={multiple}
                onChange={handleFileSelect}
                disabled={disabled || isUploading}
                className="hidden"
                aria-label="File upload input"
            />

            <button
                type="button"
                onClick={handleButtonClick}
                disabled={disabled || isUploading}
                className="btn btn-ghost text-sm flex items-center space-x-2"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span>{isUploading ? 'Uploading...' : buttonText}</span>
            </button>

            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}
        </div>
    );
};

export default FileUpload;
