import { Suspense } from 'react';

const NotFoundPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <h1 className="text-5xl flex justify-center text-red-600">404 Page</h1>
    </Suspense>
  );
};

export default NotFoundPage;
