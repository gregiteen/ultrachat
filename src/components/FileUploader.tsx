import React, { useCallback, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, CheckCircle, AlertTriangle } from 'lucide-react';
// import { isSupportedFileType } from '../lib/gemini';
import { supabase } from '../lib/supabase';

interface FileUploaderProps {
  onChange: (paths: string[]) => void;
  maxFiles?: number;
  maxSize?: number;
}

export function FileUploader({
  onChange,
  maxFiles = 5,
  maxSize = 4 * 1024 * 1024 // 4MB default
}: FileUploaderProps) {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);


  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploadError(null);

    const validFiles = acceptedFiles.filter(file =>
      file.size <= maxSize //isSupportedFileType(file.type) && 
    );
    
    if (validFiles.length + uploadedFiles.length > maxFiles) {
      setUploadError(`You can only upload a maximum of ${maxFiles} files.`);
      return;
    }

    const uploadPromises = validFiles.map(async (file) => {
      const filePath = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file);

        // TODO: Implement progress tracking if needed.

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setUploadError(`Failed to upload ${file.name}: ${uploadError.message}`);
        return null;
      }

      return filePath;
    });


    Promise.all(uploadPromises).then((results) => {
        const successfulUploads = results.filter((result): result is string => result !== null);
        const allFiles = [...uploadedFiles, ...successfulUploads];
        onChange(allFiles);
        setUploadedFiles(allFiles);
    });


  }, [maxFiles, maxSize, onChange, uploadedFiles, setUploadedFiles]);

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
          {uploadedFiles.map((filePath) => {
            const filename = filePath.split('/').pop()!;
            return (
              <li
                key={filename}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{filename}</span>
                  <CheckCircle className='h-4 w-4 text-green-500' />
                </div>
                <button
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}