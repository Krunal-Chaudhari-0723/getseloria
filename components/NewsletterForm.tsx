'use client';

export default function NewsletterForm() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert('Thank you for subscribing!');
    (e.target as HTMLFormElement).reset();
  };

  return (
    <form className="flex flex-col sm:flex-row gap-3" onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Your email address"
        required
        className="flex-1 px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-white/50"
      />
      <button
        type="submit"
        className="px-7 py-3 bg-white text-[#7B2D42] text-[10px] tracking-[0.3em] uppercase font-semibold hover:bg-[#F5F0EB] transition-colors whitespace-nowrap"
      >
        Subscribe
      </button>
    </form>
  );
}
