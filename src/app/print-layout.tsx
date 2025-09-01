
'use client';

// This is a simplified layout for printing, without navigation or headers.
export function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white text-black p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        {children}
      </div>
    </div>
  );
}
