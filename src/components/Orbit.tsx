import { HTMLAttributes } from 'react'
import { twMerge } from 'tailwind-merge'

const Orbit = (props: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={twMerge("size-[200px] border border-stone-700/30 rounded-full", props.className)}></div>
  )
}

export default Orbit