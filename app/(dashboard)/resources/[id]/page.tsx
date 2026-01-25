'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronRight, Music } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Sermon = {
  id: string;
  title: string;
  speaker: string;
  date: string;
  thumbnail?: string;
  youtubeId?: string;
  spotifyLink?: string;
  articleContent?: string; // Markdown content as string
};

export default function SermonDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [sermon, setSermon] = useState<Sermon | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSermon();
  }, [id]);

  useEffect(() => { 
    window.scrollTo(0, 0); 
  }, [id]);

  const fetchSermon = async () => {
    try {
      const res = await fetch(`/api/sermons/${id}`);
      const data = await res.json();
      setSermon(data.sermon);
    } catch (error) {
      console.error('Error fetching sermon:', error);
    } finally {
      setLoading(false);
    }
  };

  // Convert any YouTube URL format to embed URL
  const getYouTubeEmbedUrl = (url: string): string => {
    if (!url) return '';
    
    // If it's already an embed URL, return as is
    if (url.includes('youtube.com/embed/')) {
      return url;
    }
    
    // Extract video ID from various YouTube URL formats
    let videoId = '';
    
    // Handle full YouTube URLs: https://www.youtube.com/watch?v=VIDEO_ID
    const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (watchMatch) {
      videoId = watchMatch[1];
    } else if (!url.includes('http')) {
      // If it's just a video ID, use it directly
      videoId = url;
    } else {
      // Try to extract from any other format
      const idMatch = url.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/);
      if (idMatch) {
        videoId = idMatch[1];
      } else {
        // If we can't parse it, return the original (might be a different format)
        return url;
      }
    }
    
    return `https://www.youtube.com/embed/${videoId}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-28 pb-20 px-6 flex items-center justify-center">
        <p className="text-stone-500">Loading...</p>
      </div>
    );
  }

  if (!sermon) {
    return (
      <div className="min-h-screen bg-white pt-28 pb-20 px-6 flex items-center justify-center">
        <p className="text-stone-500">Sermon not found</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-white pt-28 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* 3-column grid: left empty, center content, right sticky sidebar */}
        <div className="grid grid-cols-12 gap-8 lg:gap-12">
          {/* Left column - empty */}
          <div className="hidden lg:block lg:col-span-2"></div>
          
          {/* Center column - main content */}
          <div className="col-span-12 lg:col-span-6">
            <div className="flex items-center text-xs font-bold uppercase tracking-widest text-stone-400 mb-8">
              <Link href="/resources" className="hover:text-stone-900 transition-colors">Resources</Link>
              <ChevronRight className="w-4 h-4 mx-2" />
              <span className="text-stone-900 line-clamp-1">{sermon.title}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-stone-900 mb-4 leading-tight">{sermon.title}</h1>
            <p className="text-stone-500 mb-8 text-lg font-medium">{sermon.date} • {sermon.speaker}</p>
            
            {/* Mobile: Show video and Spotify at top */}
            <div className="lg:hidden space-y-6 mb-8">
              {sermon.youtubeId && (
                <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-lg bg-black">
                  <iframe width="100%" height="100%" src={getYouTubeEmbedUrl(sermon.youtubeId)} title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="border-0"></iframe>
                </div>
              )}
              {sermon.spotifyLink && (
                <a href={sermon.spotifyLink} target="_blank" rel="noreferrer" className="flex items-center gap-4 bg-[#1DB954] hover:bg-[#1ed760] text-white p-4 rounded-xl shadow-md transition-colors no-underline">
                  <Music className="w-8 h-8" />
                  <div className="flex flex-col">
                    <span className="font-bold text-lg leading-none m-0">Listen on Spotify</span>
                    <span className="text-white/80 text-sm m-0">Audio Podcast Available</span>
                  </div>
                  <ChevronRight className="w-6 h-6 ml-auto" />
                </a>
              )}
            </div>
            
            <article>
              {sermon.articleContent && (
                <div className="font-sans">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({children, ...props}) => <h1 className="text-4xl font-black tracking-tight text-stone-900 mt-8 mb-4" {...props}>{children}</h1>,
                      h2: ({children, ...props}) => <h2 className="text-3xl font-black tracking-tight text-stone-900 mt-8 mb-4" {...props}>{children}</h2>,
                      h3: ({children, ...props}) => <h3 className="text-2xl font-bold text-stone-900 mt-8 mb-4" {...props}>{children}</h3>,
                      h4: ({children, ...props}) => <h4 className="text-xl font-bold text-stone-900 mt-6 mb-3" {...props}>{children}</h4>,
                      p: ({children, ...props}) => <p className="mb-4 text-stone-700 leading-relaxed" {...props}>{children}</p>,
                      ul: ({children, ...props}) => <ul className="list-disc pl-6 space-y-2 mb-4 marker:text-stone-900" {...props}>{children}</ul>,
                      ol: ({children, ...props}) => <ol className="list-decimal pl-6 space-y-2 mb-4 marker:text-stone-900" {...props}>{children}</ol>,
                      li: ({children, ...props}) => <li className="text-stone-700 leading-relaxed" {...props}>{children}</li>,
                      strong: ({children, ...props}) => <strong className="font-bold text-stone-900" {...props}>{children}</strong>,
                      em: ({children, ...props}) => <em className="italic" {...props}>{children}</em>,
                      a: ({children, ...props}) => <a className="text-stone-900 underline hover:text-stone-600 transition-colors" {...props}>{children}</a>,
                      blockquote: ({children, ...props}) => <blockquote className="border-l-4 border-stone-300 pl-4 italic text-stone-600 my-4" {...props}>{children}</blockquote>,
                      code: ({inline, children, ...props}) => 
                        inline ? (
                          <code className="bg-stone-100 px-1.5 py-0.5 rounded text-sm font-mono text-stone-900" {...props}>{children}</code>
                        ) : (
                          <code className="block bg-stone-100 p-4 rounded-lg text-sm font-mono text-stone-900 overflow-x-auto my-4" {...props}>{children}</code>
                        ),
                      pre: ({children, ...props}) => <pre className="bg-stone-100 p-4 rounded-lg overflow-x-auto my-4" {...props}>{children}</pre>,
                    }}
                  >
                    {sermon.articleContent}
                  </ReactMarkdown>
                </div>
              )}
            </article>
          </div>
          
          {/* Right column - sticky sidebar */}
          <div className="hidden lg:block lg:col-span-4">
            <div className="sticky top-32 space-y-6">
              {sermon.youtubeId && (
                <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-lg bg-black">
                  <iframe width="100%" height="100%" src={getYouTubeEmbedUrl(sermon.youtubeId)} title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="border-0"></iframe>
                </div>
              )}
              {sermon.spotifyLink && (
                <a href={sermon.spotifyLink} target="_blank" rel="noreferrer" className="flex items-center gap-4 bg-[#1DB954] hover:bg-[#1ed760] text-white p-4 rounded-xl shadow-md transition-colors no-underline">
                  <Music className="w-8 h-8" />
                  <div className="flex flex-col">
                    <span className="font-bold text-lg leading-none m-0">Listen on Spotify</span>
                    <span className="text-white/80 text-sm m-0">Audio Podcast Available</span>
                  </div>
                  <ChevronRight className="w-6 h-6 ml-auto" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
