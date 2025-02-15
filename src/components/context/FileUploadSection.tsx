import React, { useState } from 'react';
import { FileUploader } from '../FileUploader';

interface FileUploadSectionProps {
  onChange: (files: string[]) => void;
}

export function FileUploadSection({
  onChange
}: FileUploadSectionProps) {

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        Upload Files
      </label>
      <FileUploader
        onChange={onChange}
      />
    </div>
  );
}