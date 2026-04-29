import { HTMLAttributes } from "react"
import { twMerge } from "tailwind-merge"

const SectionBorder = (props: { borderTop?: boolean } & HTMLAttributes<HTMLDivElement>) => {
  const { className, borderTop, children, ...otherProps } = props;
  return (
    <div
      className={twMerge(
        'border-l border-r -mx-12 border-stone-800/30 relative',
        borderTop && 'border-t border-stone-800/30',
        className
      )}
      {...otherProps}
    >
      {borderTop && (
        <>
          <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-3 h-3">
            <div className="w-full h-px bg-stone-700/60 absolute top-1/2" />
            <div className="h-full w-px bg-stone-700/60 absolute left-1/2" />
          </div>
          <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-3 h-3">
            <div className="w-full h-px bg-stone-700/60 absolute top-1/2" />
            <div className="h-full w-px bg-stone-700/60 absolute left-1/2" />
          </div>
        </>
      )}
      {children}
    </div>
  );
}

export default SectionBorder
