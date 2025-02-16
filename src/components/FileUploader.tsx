import React, { useRef, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface FileUploaderProps {
  onChange: (paths: string[]) => void;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
  accept?: string;
  multiple?: boolean;
}

export function FileUploader({
  onChange,
  disabled = false,
  className = '',
  children,
  accept = '*',
  multiple = true
}: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      const paths = await Promise.all(
        files.map(async (file) => {
          const filePath = `${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('user-uploads')
            .upload(filePath, file);

          if (uploadError) {
            console.error('Upload error:', uploadError);
            return null;
          }
          return filePath;
        })
      );

      const successfulUploads = paths.filter((path): path is string => path !== null);
      onChange(successfulUploads);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        multiple={multiple}
        accept={accept}
        disabled={disabled}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className={className}
      >
        {children || 'Upload Files'}
      </button>
    </>
  );
}