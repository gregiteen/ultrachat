import React, { useCallback, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, CheckCircle, AlertTriangle, FileText, Image, Film, Music, FileIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FileUploaderProps {
  onChange: (paths: string[]) => void;
  maxFiles?: number;
  maxSize?: number;
}

const SUPPORTED_FILE_TYPES = {
  'image': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  'pdf': ['application/pdf'],
  'text': ['text/plain', 'text/markdown', 'text/csv', 'application/json', 'application/xml'],
  'audio': ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  'video': ['video/mp4', 'video/webm']
};

const isSupportedFileType = (mimeType: string): boolean => {
  return Object.values(SUPPORTED_FILE_TYPES).some(types => types.includes(mimeType));
};

interface UploadedFile {
  path: string;
  type: string;
  name: string;
  url?: string;
}

export function FileUploader({
  onChange,
  maxFiles = 5,
  maxSize = 4 * 1024 * 1024 // 4MB default
}: FileUploaderProps) {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type.startsWith('video/')) return <Film className="h-4 w-4" />;
    if (type.startsWith('audio/')) return <Music className="h-4 w-4" />;
    if (type.startsWith('text/') || type.includes('application/')) return <FileText className="h-4 w-4" />;
    return <FileIcon className="h-4 w-4" />;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploadError(null);

    const validFiles = acceptedFiles.filter(file =>
      isSupportedFileType(file.type) && file.size <= maxSize
    );
    
    if (validFiles.length + uploadedFiles.length > maxFiles) {
      setUploadError(`You can only upload a maximum of ${maxFiles} files.`);
      return;
    }

    const uploadPromises = validFiles.map(async (file) => {
      const filePath = `${Date.now()}-${file.name}`;
      const { error: uploadError, data } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setUploadError(`Failed to upload ${file.name}: ${uploadError.message}`);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath);

      return {
        path: filePath,
        type: file.type,
        name: file.name,
        url: publicUrl
      } as UploadedFile;
    });

    try {
      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter((result): result is UploadedFile => result !== null);
      const allFiles = [...uploadedFiles, ...successfulUploads];
      onChange(allFiles.map(f => f.path));
      setUploadedFiles(allFiles);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Failed to upload files. Please try again.');
    }
  }, [maxFiles, maxSize, onChange, uploadedFiles]);

  const removeFile = async (fileToRemove: UploadedFile) => {
    try {
      const { error } = await supabase.storage
        .from('user-uploads')
        .remove([fileToRemove.path]);

      if (error) {
        setUploadError(`Failed to remove ${fileToRemove.name}: ${error.message}`);
        return;
      }

      const updatedFiles = uploadedFiles.filter(file => file.path !== fileToRemove.path);
      setUploadedFiles(updatedFiles);
      onChange(updatedFiles.map(f => f.path));
    } catch (error) {
      console.error('Remove error:', error);
      setUploadError('Failed to remove file. Please try again.');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: maxFiles - uploadedFiles.length,
    maxSize,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'text/*': ['.txt', '.md', '.csv', '.json', '.xml'],
      'audio/*': ['.mp3', '.wav', '.ogg'],
      'video/*': ['.mp4', '.webm']
    }
  });
    
  const openFileSelector = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        multiple
        accept="image/*, .pdf, .txt, .md, .csv, .json, .xml, audio/*, video/*"
        onChange={(e) => {
          if (e.target.files) {
            onDrop(Array.from(e.target.files));
          }
        }}
        capture="environment"
      />
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
          }`}
        onClick={openFileSelector}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive
            ? 'Drop the files here...'
            : 'Drag & drop files here, or click to select'}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Max {maxFiles} files, up to {Math.round(maxSize / 1024 / 1024)}MB each
        </p>
      </div>

      {uploadError && (
        <div className="text-red-500 text-sm">
          <AlertTriangle className="inline-block h-4 w-4 mr-1" />
          {uploadError}
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <ul className="space-y-2">
          {uploadedFiles.map((file) => (
            <li
              key={file.path}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
            >
              <div className="flex items-center space-x-2">
                {getFileIcon(file.type)}
                <span className="text-sm text-gray-600">{file.name}</span>
                <CheckCircle className='h-4 w-4 text-green-500' />
              </div>
              {file.type.startsWith('image/') && file.url && (
                <div className="flex-shrink-0">
                  <img
                    src={file.url}
                    alt={file.name}
                    className="h-8 w-8 object-cover rounded"
                  />
                </div>
              )}
              <button
                onClick={() => removeFile(file)}
                className="text-gray-400 hover:text-red-500"
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}