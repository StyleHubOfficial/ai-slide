
import React from 'react';
import ImageIcon from '../icons/ImageIcon';

interface FileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const FileInput: React.FC<FileInputProps> = (props) => {
  return (
    <div className="mt-2 flex justify-center rounded-lg border border-dashed border-slate-600 px-6 py-10 hover:border-sky-500 transition-colors">
      <div className="text-center">
        <ImageIcon className="mx-auto h-12 w-12 text-slate-500" aria-hidden="true" />
        <div className="mt-4 flex text-sm leading-6 text-slate-400">
          <label
            htmlFor="file-upload"
            className="relative cursor-pointer rounded-md font-semibold text-sky-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-sky-500 focus-within:ring-offset-2 focus-within:ring-offset-slate-900 hover:text-sky-300"
          >
            <span>Upload a file</span>
            <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" {...props} />
          </label>
          <p className="pl-1">or drag and drop</p>
        </div>
        <p className="text-xs leading-5 text-slate-500">PNG, JPG, GIF up to 10MB</p>
      </div>
    </div>
  );
};

export default FileInput;
