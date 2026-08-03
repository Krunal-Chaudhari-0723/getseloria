'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function WhatsAppButton() {
  const pathname = usePathname();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Fetch contact details from the database settings with cache-busting
    fetch('/api/settings', { cache: 'no-store' })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Failed to load settings');
      })
      .then((data) => {
        if (data?.contact?.phone) {
          setPhoneNumber(data.contact.phone);
        }
      })
      .catch((err) => console.error('Error fetching settings for WhatsApp:', err));
  }, []);

  // Avoid hydration mismatch by rendering nothing on server side
  if (!mounted) {
    return null;
  }

  // Hide the WhatsApp button on the admin side
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  // Sanitize the phone number: remove non-digits
  let sanitizedNumber = phoneNumber ? phoneNumber.replace(/\D/g, '') : '';

  // If no number is set, default to a placeholder
  if (!sanitizedNumber) {
    sanitizedNumber = '919232845808';
  } else if (sanitizedNumber.length === 10) {
    // If it's a 10-digit Indian number without country code, automatically prepend '91'
    sanitizedNumber = '91' + sanitizedNumber;
  }

  const whatsappUrl = `https://wa.me/${sanitizedNumber}?text=${encodeURIComponent(
    'Hello! I have a question about Seloria Products'
  )}`;

  return (
    <>
      {/* Custom styles for the premium glowing background effect */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes whatsapp-pulse-glow {
              0% {
                transform: scale(0.95);
                box-shadow: 0 0 0 0 rgba(26, 209, 110, 0.5);
              }
              70% {
                transform: scale(1.15);
                box-shadow: 0 0 0 15px rgba(26, 209, 110, 0);
              }
              100% {
                transform: scale(0.95);
                box-shadow: 0 0 0 0 rgba(26, 209, 110, 0);
              }
            }
            .whatsapp-glow {
              animation: whatsapp-pulse-glow 2s infinite ease-in-out;
            }
          `,
        }}
      />
      <div className="fixed bottom-6 right-6 z-50 group flex h-14 w-14 md:h-16 md:w-16 items-center justify-center">
        {/* Glow backdrop layer */}
        <div className="absolute inset-0 rounded-full bg-[#1ad16e]/20 whatsapp-glow pointer-events-none" />

        {/* Floating Button */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="relative flex h-full w-full items-center justify-center rounded-full bg-gradient-to-tr from-[#1ad16e] to-[#079a74] text-white shadow-lg transition-transform duration-300 hover:scale-110 active:scale-95 focus:outline-none"
        >
          {/* WhatsApp Outline Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-7 w-7 md:h-8 md:w-8 transition-transform group-hover:rotate-12 duration-300"
          >
            <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
          </svg>
        </a>
      </div>
    </>
  );
}
