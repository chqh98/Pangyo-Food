import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '판교 회식 추천',
  description: '쏠리드스페이스 반경 1km 회식 장소 추천 — 네이버·구글·카카오 리뷰와 영업 상태를 한 번에',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
