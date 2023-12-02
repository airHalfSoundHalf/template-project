'use client'

import React from 'react'
import { NextPage } from 'next'
import Image from 'next/image'

import renewal from './assets/image/renewal.svg'

const App: NextPage = () => {
  return (
    <main id='main'>
      <div className={'bg-area'}>
        <Image priority quality={100} src={renewal} alt={'리뉴얼 진행중 이미지'} />
      </div>
    </main>
  )
}

export default App
