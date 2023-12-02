import React from 'react'
import './assets/css/globals.scss'
import localFont from 'next/font/local'
import { Metadata } from 'next'

import NEXT_SEO_DEFAULT from '../next-seo-config'

import RecoilProvider from './libs/client/recoil/RecoilProvider'
import QueryProvider from './libs/client/reactQuery/QueryProvider'

const myFont = localFont({
  src: './assets/font/PretendardVariable.woff2',
})

export const metadata: Metadata = {
  ...NEXT_SEO_DEFAULT,
  title: {
    template: '%s | 애드에드',
    default: '애드에드',
  },
  description: '마케팅 홍보 대행사',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='ko-KR'>
      <body className={myFont.className} suppressHydrationWarning>
        <RecoilProvider>
          <QueryProvider>{children}</QueryProvider>
        </RecoilProvider>
      </body>
    </html>
  )
}
