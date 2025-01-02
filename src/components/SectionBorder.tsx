import { HTMLAttributes } from "react"
import { twMerge } from "tailwind-merge"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

const SectionBorder = (props: { borderTop?: boolean} & HTMLAttributes<HTMLDivElement>) => {
  const {className, borderTop, children, ...otherprops} = props;
  return (
    <div className={twMerge('border-l border-r -mx-12 border-gray-200/20 relative',
      borderTop && 'border-t',
      className)} {...otherprops} >
        {borderTop && (
          <>
           <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2">
            <FontAwesomeIcon icon={faPlus} className="size-4 text-gray-200" />
           </div>
           <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2">
           <FontAwesomeIcon icon={faPlus} className="size-4 text-gray-200" />
           </div>
          </>
        )}
      {children}
      </div>
  );
}

export default SectionBorder