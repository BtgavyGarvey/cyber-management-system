// app/page.jsx (Server Component)
import { Suspense } from 'react';
import PesapalReturnPage from '@/components/payment-status/index'; // A client component

export default function Page() {
  return (
    <section>
      {/* Wrap the client component in Suspense */}
      <Suspense fallback={<div>Loading page...</div>}>
        <PesapalReturnPage />
      </Suspense>
      {/* Other static content */}
    </section>
  );
}
