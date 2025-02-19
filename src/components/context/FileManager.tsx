import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-service';
import { usePersonalizationStore } from '../../store/personalization';

export function FileManager() {
  const { user } = useAuth();
  const { 
    personalInfo, 
    updatePersonalInfo, 
    initialized: personalizationInitialized, 
    loading: personalizationLoading 
  } = usePersonalizationStore();
  const [files, setFiles] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (personalizationInitialized && !personalizationLoading) {
      setFiles(personalInfo.files || []);
    }
  }, [personalInfo.files, personalizationInitialized, personalizationLoading]);

  const handleFileUpload = async (paths: string[]) => {
    if (!user || uploading) return;
    setUploading(true);

    try {
      const updatedFiles = [...(personalInfo.files || []), ...paths];
      await updatePersonalInfo({
        ...personalInfo,
        files: updatedFiles
      });
      setFiles(updatedFiles);
    } catch (error) {
      console.error('Failed to upload files:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleFileDelete = async (filePath: string) => {
    if (!user) return;

    try {
      const updatedFiles = (personalInfo.files || []).filter(f => f !== filePath);
      await updatePersonalInfo({
        ...personalInfo,
        files: updatedFiles
      });
      setFiles(updatedFiles);
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  if (!user || !personalizationInitialized || personalizationLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* File Upload */}
      <div className="flex items-center gap-4">
        <input
          type="file"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            const paths = files.map(file => URL.createObjectURL(file));
            handleFileUpload(paths);
          }}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors cursor-pointer"
        >
          {uploading ? 'Uploading...' : 'Upload Files'}
        </label>
      </div>

      {/* File List */}
      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file}
            className="flex items-center justify-between p-3 bg-accent rounded-md"
          >
            <span className="text-sm truncate">{file.split('/').pop()}</span>
            <button
              onClick={() => handleFileDelete(file)}
              className="p-1 hover:bg-background rounded-md text-destructive"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}