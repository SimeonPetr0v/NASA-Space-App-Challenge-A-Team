import { useSyncExternalStore } from 'react'

/*
  Phones and tablets: their main pointer is a finger ("pointer: coarse").
  Computers, touch-screen laptops included, have a mouse or trackpad as the
  main pointer and one webcam, so they get no front/back camera choice.
*/

const QUERY = '(pointer: coarse)'

const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

export const useTouchDevice = () =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  )
