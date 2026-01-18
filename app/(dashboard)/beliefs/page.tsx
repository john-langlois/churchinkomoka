'use client';

import { useState } from 'react';
import { SectionHeader } from '@/src/components/SectionHeader';
import { TogglableVerse } from '@/src/components/TogglableVerse';
import { BeliefAccordion } from '@/src/components/BeliefAccordion';
import { beliefsData } from '@/src/lib/data';

export default function BeliefsPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <div className="min-h-screen bg-stone-50 pt-24">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12 md:py-20">
        <SectionHeader title="What We Believe" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
           {/* Sidebar Intro */}
           <div className="lg:col-span-5">
              <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-stone-100 sticky top-32">
                <h3 className="text-3xl font-bold text-stone-900 mb-6">Our Commitment</h3>
                <div className="prose prose-lg text-stone-600 font-medium">
                    <p className="mb-6">
                        We are part of the Church in Komoka, ON. We are disciples of the Lord Jesus Christ. Disciple means, apprentice, student or follower.
                    </p>
                    <p className="mb-8">
                        We have decided to surrender our lives to our Lord Jesus Christ and obey Him only.
                    </p>
                    <TogglableVerse reference="John 3:16" text="For God so loved the world that He gave His only begotten Son, that whoever believes in him shall not perish, but have eternal life." />
                    <TogglableVerse reference="1 John 5:11-12" text="And the testimony is this, that God has given us eternal life, and this life is in His Son. He who has the Son has the life, and he who does not have the Son of God does not have the life." />
                </div>
              </div>
           </div>

           {/* Accordion List */}
           <div className="lg:col-span-7 flex flex-col gap-4">
              {beliefsData.map((belief: { title: string; content: string }, idx: number) => (
                <BeliefAccordion key={idx} title={belief.title} content={belief.content} isOpen={openIndex === idx} onClick={() => setOpenIndex(openIndex === idx ? null : idx)} />
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
