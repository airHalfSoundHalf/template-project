import { Metadata } from 'next'

const NEXT_SEO_DEFAULT: Metadata = {
  manifest: '/manifest.json',
  themeColor: '#ffffff',
  metadataBase: new URL('https://acme.com'),
  keywords: ['마케팅', '광고', '대행', '홍보'],
  openGraph: {
    title: '애드에드',
    description: '마케팅 홍보 대행사',
    url: 'https://blockad.co.kr/',
    siteName: '애드에드',
    locale: 'ko-KR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '애드에드',
    description: '마케팅 홍보 대행사',
  },
}

export default NEXT_SEO_DEFAULT
