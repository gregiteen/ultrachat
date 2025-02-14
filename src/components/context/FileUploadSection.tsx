import React from 'react';
import { Upload, X } from 'lucide-react';

interface FileUploadSectionProps {
  files: File[];
  setFiles: (files: File[]) => void;
  uploadProgress: Record<string, number>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: (index: number) => void;
}

export function FileUploadSection({
  files,
  uploadProgress,
  onFileChange,
  removeFile,
}: FileUploadSectionProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        Upload Files
      </label>
      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-muted rounded-md">
        <div className="space-y-1 text-center">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
          <div className="flex text-sm text-foreground">
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer rounded-md font-medium text-primary hover:text-secondary focus-within:outline-none"
            >
              <span>Upload files</span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                multiple
                onChange={onFileChange}
              />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-muted-foreground">
            PDF, TXT, and other text files supported
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((file, index) => (
            <li
              key={index}
              className="flex items-center justify-between py-2 px-3 bg-muted rounded-md"
            >
              <div className="flex-1">
                <span className="text-sm text-foreground">{file.name}</span>
                {uploadProgress[file.name] !== undefined && (
                  <div className="w-full h-1 bg-muted rounded-full mt-1">
                    <div
                      className="h-1 bg-primary rounded-full"
                      style={{ width: `${uploadProgress[file.name]}%` }}
                    />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="ml-2 text-muted-foreground hover:text-red-600 transition-colors"
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