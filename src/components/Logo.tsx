import logoImage from "@/assets/images/sphereal-logo.svg?url"
import { twMerge } from "tailwind-merge";
import { HTMLAttributes } from "react"

const Logo = (props: HTMLAttributes<HTMLDivElement>) => {
  const { className, style, ...otherProps } = props;
  return (
    <div
      className={twMerge("size-8 bg-gradient-to-br from-indigo-500 via-cyan-400 to-indigo-600 p-0.5", className)}
      style={{
        maskImage: `url(${logoImage.src})`,
        maskSize: "contain",
        maskPosition: "center",
        maskRepeat: "no-repeat",
        ...style,
      }}
      {...otherProps}
    />
  );
}

export default Logo
