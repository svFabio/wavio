export const ChatMessagesSkeleton = (): React.JSX.Element => (
  <div className="space-y-4 p-2">
    {[...Array(5)].map((_, i) => (
      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
        <div className={`skeleton rounded-2xl ${i % 2 === 0 ? 'w-3/5 h-10' : 'w-2/5 h-8'}`} />
      </div>
    ))}
  </div>
);
