import logoImage from "@/assets/images/sphereal-logo.svg?url"
import { twMerge } from "tailwind-merge";
import { HTMLAttributes } from "react"

const Logo = (props: HTMLAttributes<HTMLDivElement>) => {
    const {className, style, ...otherProps} = props;
  return (
    <div className={twMerge("size-10 bg-gray-200 bg-gradient-to-r from-amber-300 via-teal-300 to-fuchsia-400 p-0.5))]", className)} style={{maskImage: `url(${logoImage.src})`, maskSize: "contain", ...style,}} {...otherProps} ></div> 
  )
}

export default Logo