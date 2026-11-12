'use client';

import { useState } from 'react';
import { PlayCircle, Image as ImageIcon } from 'lucide-react';

interface AircraftImage {
  id: string;
  url: string;
  caption: string | null;
  source: string;
  license: string;
}

interface MediaViewerProps {
  youtubeId: string;
  images: AircraftImage[];
}

export function MediaViewer({ youtubeId, images }: MediaViewerProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Check if YouTube ID is valid
  const isValidYouTubeId = (id: string) => {
    if (id.startsWith('TODO_VERIFY_')) return false;
    return /^[\w-]{11}$/.test(id);
  };

  const hasValidImages = images.length > 0 && 
    images.some(img => !img.url.startsWith('TODO_VERIFY_'));

  return (
    <div className="bg-panel rounded-lg p-6 mb-8">
      <h2 className="text-xl font-semibold text-white mb-4">Media</h2>

      {/* Video Section */}
      <div className="mb-6">
        <h3 className="text-lg text-slate-300 mb-3">Video</h3>
        
        {isValidYouTubeId(youtubeId) ? (
          <div className="relative aspect-video bg-slate-800 rounded-lg overflow-hidden">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?rel=0`}
              title="Aircraft video"
              className="absolute inset-0 w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        ) : (
          <div className="relative aspect-video bg-slate-800/50 rounded-lg overflow-hidden flex items-center justify-center border border-slate-700">
            <div className="text-center text-slate-400">
              <PlayCircle className="w-16 h-16 mx-auto mb-2" />
              <p className="text-sm">Video unavailable</p>
              {youtubeId && !youtubeId.startsWith('TODO_VERIFY_') && (
                <p className="text-xs mt-1">Invalid YouTube ID</p>
              )}
            </div>
            
            {/* YouTube search button */}
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(youtubeId.replace('TODO_VERIFY_', ''))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-4 right-4 px-3 py-1 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 text-xs rounded transition-colors"
            >
              Search YouTube
            </a>
          </div>
        )}
      </div>

      {/* Photo Gallery */}
      <div>
        <h3 className="text-lg text-slate-300 mb-3">Photo Gallery</h3>
        
        {hasValidImages ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => {
              // Skip TODO_VERIFY_ images
              if (image.url.startsWith('TODO_VERIFY_')) {
                return null;
              }

              return (
                <button
                  key={image.id}
                  onClick={() => setSelectedImage(image.url)}
                  className="group relative aspect-square bg-slate-800/50 rounded-lg overflow-hidden hover:scale-105 transition-transform duration-200 focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:outline-none"
                  aria-label={`View ${image.caption || 'image'}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={image.caption || 'Aircraft image'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-white" />
                  </div>

                  {/* Caption with source and license */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2 text-xs">
                    {image.caption && (
                      <p className="text-white truncate">{image.caption}</p>
                    )}
                    <p className="text-slate-400">
                      {image.source} | {image.license}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-800/50 rounded-lg p-8 text-center text-slate-400">
            <ImageIcon className="w-12 h-12 mx-auto mb-2" />
            <p>No images available</p>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-accent-cyan transition-colors text-2xl"
            aria-label="Close"
          >
            &times;
          </button>
          
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedImage}
            alt="Full size"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
