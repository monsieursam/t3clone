'use client';

import React, { useState, useRef } from 'react';
import { api } from '@/trpc/client';

/**
 * Helper function to extract base64 data from a data URL
 */
const extractBase64 = (dataUrl: string): string => {
  return dataUrl.split(',')[1];
};

/**
 * Component for editing images using AI
 * Handles image upload, display, and editing functionality
 */
interface ImageEditorProps {
  setGeneratedImage: (image: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setMode: (mode: 'generate' | 'edit') => void;
}

export default function ImageEditor({
  setGeneratedImage,
  setIsLoading,
  setError,
  setMode
}: ImageEditorProps) {
  const [prompt, setPrompt] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutateAsync: editImage } = api.imageGenerator.edit.useMutation();

  /**
   * Handles image upload from file input
   * Converts files to base64 and updates state
   */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setUploadedImages(prev => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });
  };

  /**
   * Handles removing an image from the uploaded images list
   */
  const handleRemoveImage = (indexToRemove: number) => {
    setUploadedImages(prev => prev.filter((_, index) => index !== indexToRemove));

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // If all images are removed, switch back to generate mode
    if (uploadedImages.length <= 1) {
      setMode('generate');
    }
  };

  /**
   * Handles the form submission for image editing
   * Validates input and calls the API
   */
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (uploadedImages.length === 0 || !prompt.trim()) {
      const errorMsg = 'Please upload at least one image and provide editing instructions';
      setLocalError(errorMsg);
      setError(errorMsg);
      return;
    }

    try {
      setIsLoading(true);
      setLocalError(null);
      setError(null);

      // Process images to extract base64 data
      const processedImages = [...uploadedImages];
      processedImages.forEach((image, index) => {
        processedImages[index] = extractBase64(image);
      });

      const data = await editImage({
        imageFiles: processedImages,
        prompt,
      });

      if (!data) {
        throw new Error(`API error: ${data}`);
      }

      const formattedImageData = `data:image/png;base64,${data?.data?.[0].b64_json}`;
      setGeneratedImage(formattedImageData);
    } catch (err) {
      console.error('Error editing image:', err);
      const errorMsg = 'Failed to edit image. Please try again.';
      setLocalError(errorMsg);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleEditSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Upload images to edit
        </label>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          multiple
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-indigo-50 file:text-indigo-700
            hover:file:bg-indigo-100"
        />
      </div>

      {uploadedImages.length > 0 && (
        <div className="mb-4 grid grid-cols-2 md:grid-cols-3 gap-4">
          {uploadedImages.map((image, index) => (
            <div key={index} className="relative">
              <img
                src={image}
                alt={`Uploaded image ${index + 1}`}
                className="w-full h-40 object-cover rounded-md"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
          Describe how you want to edit the image(s)
        </label>
        <textarea
          id="prompt"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="E.g., Add a flying eagle in the sky..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>

      {localError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{localError}</div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={uploadedImages.length === 0}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          Edit Images
        </button>
      </div>
    </form>
  );
}
