import React, { useState, useEffect } from 'react';
import { FileUploader } from '../FileUploader';
import { supabase } from '../../lib/supabase';
import { File, Trash2, Download, Eye, Upload } from 'lucide-react';
import { usePersonalizationStore } from '../../store/personalization';
import { useAuthStore } from '../../store/auth';

interface FileManagerProps {
  onFileSelect?: (file: string) => void;
}

export function FileManager({ onFileSelect }: FileManagerProps) {
  const { personalInfo, updatePersonalInfo, initialized: personalizationInitialized, loading: personalizationLoading } = usePersonalizationStore();
  const { initialized: authInitialized, user } = useAuthStore();
  const [files, setFiles] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (personalizationInitialized && authInitialized && user && !personalizationLoading) {
      setFiles(personalInfo.files || []);
    }
  }, [personalInfo.files, personalizationInitialized, authInitialized, user, personalizationLoading]);

  const handleFileUpload = async (paths: string[]) => {
    if (!user || uploading) return;
    setUploading(true);
    try {
      const newFiles = [...files, ...paths];
      await updatePersonalInfo({
        ...personalInfo,
        files: newFiles
      });
      setFiles(newFiles);
    } catch (error) {
      console.error('Error updating files:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleFileDelete = async (filePath: string) => {
    if (!user) return;
    try {
      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('user-uploads')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      // Update personal info
      const newFiles = files.filter(f => f !== filePath);
      await updatePersonalInfo({
        ...personalInfo,
        files: newFiles
      });
      setFiles(newFiles);

      if (selectedFile === filePath) {
        setSelectedFile(null);
        setPreviewUrl(null);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleFileDownload = async (filePath: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase.storage
        .from('user-uploads')
        .download(filePath);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split('/').pop() || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleFilePreview = async (filePath: string) => {
    if (!user) return;
    try {
      const { data } = await supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath);

      setSelectedFile(filePath);
      setPreviewUrl(data.publicUrl);
    } catch (error) {
      console.error('Error previewing file:', error);
    }
  };

  const getFileIcon = (filePath: string) => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      default:
        return '📁';
    }
  };

  if (!authInitialized || !user) {
    return (
      <div className="bg-background border border-muted rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-center h-32">
          <div className="text-lg text-muted-foreground">
            Please log in to manage files.
          </div>
        </div>
      </div>
    );
  }

  if (!personalizationInitialized || personalizationLoading) {
    return (
      <div className="bg-background border border-muted rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-center h-32">
          <div className="animate-pulse text-lg text-muted-foreground">
            Loading files...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background border border-muted rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Personalization Files</h3>
        <FileUploader
          onChange={handleFileUpload}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-button-text rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          {uploading ? 'Uploading...' : 'Upload Files'}
        </FileUploader>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          {files.length === 0 ? (
            <div className="text-muted-foreground text-sm">
              No files uploaded yet. Upload files to enhance personalization.
            </div>
          ) : (
            files.map((filePath) => (
              <div
                key={filePath}
                className={`flex items-center justify-between p-3 rounded-md border ${
                  selectedFile === filePath
                    ? 'border-primary bg-primary/10'
                    : 'border-muted hover:border-primary/50'
                } transition-colors cursor-pointer`}
                onClick={() => {
                  handleFilePreview(filePath);
                  onFileSelect?.(filePath);
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getFileIcon(filePath)}</span>
                  <span className="text-sm truncate max-w-[200px]">
                    {filePath.split('/').pop()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFilePreview(filePath);
                    }}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFileDownload(filePath);
                    }}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFileDelete(filePath);
                    }}
                    className="p-1 text-red-500 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {selectedFile && previewUrl && (
          <div className="border border-muted rounded-md p-4">
            {previewUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full h-auto rounded-md"
              />
            ) : previewUrl.match(/\.pdf$/i) ? (
              <iframe
                src={previewUrl}
                className="w-full h-[500px] rounded-md"
                title="PDF Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-[200px] bg-muted/10 rounded-md">
                <div className="text-center">
                  <File className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Preview not available
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}