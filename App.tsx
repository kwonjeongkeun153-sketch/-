import React, { useState, useCallback } from 'react';
import { editImage } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import { UploadIcon, SparklesIcon } from './components/Icons';
import { ImageComparator } from './components/ImageComparator';

export default function App() {
    const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
    const [originalImageBase64, setOriginalImageBase64] = useState<string | null>(null);
    const [enhancedImage, setEnhancedImage] = useState<string | null>(null);

    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                setError(null);
                setEnhancedImage(null);
                setOriginalImageFile(file);
                const base64 = await fileToBase64(file);
                setOriginalImageBase64(base64);
            } catch (err) {
                setError('Failed to load image. Please try another file.');
                console.error(err);
            }
        }
    };

    const handleEnhance = useCallback(async () => {
        if (!originalImageFile) return;

        setIsEditing(true);
        setError(null);

        const enhancePrompt = `Execute an expert-level digital remastering of this photograph. Your primary goals are:
1.  **Clarity & Detail:** Eliminate distracting reflections and harsh glare. Dramatically increase resolution and sharpness to reveal intricate details.
2.  **Noise & Grain:** Subtly reduce distracting digital noise and film grain to create a smoother appearance, but carefully preserve the photo's natural texture to avoid an artificial, over-processed look. The goal is clarity, not plastic-like smoothness.
3.  **Lighting & Depth:** Meticulously balance the lighting. Enhance the dynamic range by deepening shadows and brightening highlights to create rich contrast and a powerful sense of depth.
4.  **Color Correction:** If the photo is faded or has a color cast, restore and enrich the colors. Boost saturation to make them vibrant and lifelike, but ensure the final result looks authentic and not overly saturated.
5.  **Restoration & Composition:** Seamlessly reconstruct any damaged or missing parts of the photo. Analyze the composition and crop out non-essential elements like screen borders or black bars to create a focused, high-impact image.
The final output must be a pristine, high-definition, and beautifully restored photograph that feels both clean and authentic.`;

        try {
            const base64Image = await fileToBase64(originalImageFile);
            const { base64: processedImage, mimeType } = await editImage(base64Image, originalImageFile.type, enhancePrompt);
            setEnhancedImage(`data:${mimeType};base64,${processedImage}`);
        } catch (e: any) {
            setError(`Image processing failed: ${e.message}`);
            console.error(e);
        } finally {
            setIsEditing(false);
        }
    }, [originalImageFile]);
    
    const ControlPanel = () => (
      <div className="flex flex-col gap-6 p-4 md:p-6 bg-gray-800/50 rounded-lg border border-gray-700 h-full">
        {/* Step 1: Upload */}
        <div>
          <h2 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
            <span className="bg-cyan-400 text-gray-900 rounded-full h-6 w-6 flex items-center justify-center font-bold text-sm">1</span>
            Upload Photo
          </h2>
          <label htmlFor="file-upload" className="relative block w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-cyan-400 transition-colors duration-300 overflow-hidden">
            {originalImageBase64 && (
              <img src={originalImageBase64} alt="Upload preview" className="absolute inset-0 w-full h-full object-cover opacity-30"/>
            )}
            <div className="relative z-10 flex flex-col items-center justify-center h-full bg-black/20 hover:bg-black/40 transition-colors duration-300">
              <UploadIcon className="w-8 h-8 text-gray-300 mb-2"/>
              <p className="text-sm text-gray-200 font-semibold">{originalImageFile ? 'Change Photo' : 'Click or drag to upload'}</p>
              {originalImageFile && <p className="text-xs text-gray-400 mt-1 truncate max-w-full px-2">{originalImageFile.name}</p>}
            </div>
            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageUpload} accept="image/*" />
          </label>
        </div>

        {/* Step 2: Enhance */}
        {originalImageBase64 && (
          <div className="animate-fade-in">
            <h2 className="text-lg font-semibold text-purple-400 mb-3 flex items-center gap-2">
                <span className="bg-purple-400 text-gray-900 rounded-full h-6 w-6 flex items-center justify-center font-bold text-sm">2</span>
                Enhance
            </h2>
            <div className="flex flex-col gap-4">
                <button
                    onClick={handleEnhance}
                    disabled={isEditing}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white font-bold rounded-md hover:bg-purple-700 transition-colors duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500"
                >
                    <SparklesIcon className="w-5 h-5"/>
                    Auto Enhance
                </button>
                 <p className="text-xs text-gray-400 text-center">
                    One-click AI restoration to improve quality, color, and clarity.
                </p>
            </div>
          </div>
        )}
      </div>
    );
    
    const DisplayPanel = () => (
      <div className="w-full h-full bg-gray-900 rounded-lg flex items-center justify-center border border-gray-700 overflow-hidden relative">
          {isEditing && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
                  <SparklesIcon className="w-12 h-12 text-purple-400 animate-pulse mb-4"/>
                  <p className="text-lg font-semibold">Enhancing photo...</p>
              </div>
          )}
          {error && (
              <div className="absolute inset-0 bg-red-900/40 flex flex-col items-center justify-center z-20 p-4 text-center">
                  <p className="text-lg font-bold text-red-300 mb-2">An Error Occurred</p>
                  <p className="text-red-200">{error}</p>
                   <button onClick={() => setError(null)} className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white font-semibold">
                      Try Again
                  </button>
              </div>
          )}

          {enhancedImage && originalImageBase64 ? (
              <ImageComparator beforeImage={originalImageBase64} afterImage={enhancedImage} />
          ) : originalImageBase64 ? (
              <img src={originalImageBase64} alt="Original" className="w-full h-full object-contain" />
          ) : (
              <div className="text-center text-gray-500">
                  <UploadIcon className="w-16 h-16 mx-auto mb-4"/>
                  <h3 className="text-xl font-semibold">Your photos will appear here</h3>
                  <p className="text-sm">Upload an image to get started</p>
              </div>
          )}
      </div>
    );

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col font-sans">
            <header className="py-4 px-6 md:px-8 text-center border-b border-gray-700 shadow-lg">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                    Photo Enhancer AI
                </h1>
                <p className="text-sm text-gray-400 mt-1">Restore your old photos with a single click.</p>
            </header>
            <main className="flex-grow p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto w-full">
                <div className="lg:col-span-1 h-full">
                  <ControlPanel />
                </div>
                <div className="lg:col-span-2 h-[400px] lg:h-auto min-h-[400px]">
                  <DisplayPanel />
                </div>
            </main>
             <footer className="text-center py-4 px-6 text-xs text-gray-500 border-t border-gray-800">
                Powered by Gemini.
            </footer>
        </div>
    );
}