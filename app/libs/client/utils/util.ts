'use client'

// 클래스 인라인 스타일 커스텀
export const cls = (...classnames: string[]) => {
  return classnames.join(' ')
}
