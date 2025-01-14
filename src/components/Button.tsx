import { cva } from "class-variance-authority";
import { useRouter } from "next/navigation";
import { HTMLAttributes } from "react";

export type ButtonProp = {
  variant?: 'primary' | 'secondary' | 'tertiary'; block?: boolean; disabled?: boolean;
} & HTMLAttributes<HTMLButtonElement>;

const classes = cva(
  'text-xs tracking-widest uppercase font-bold h-10 px-6 rounded-lg relative overflow-hidden',
  {
    variants: {
      block: {
        true: "w-full",
      },
      variant: {
        primary: 'border-gradient relative inline-block px-6 py-3 font-semibold text-black bg-white rounded-md hover:scale-105 transition-transform duration-300',
        secondary: 'bg-gray-100 text-gray-950 font-poppins border border-transparent',
        tertiary: 'shadow-[0_0_0_3px_#000000_inset] px-6 py-2 bg-transparent border border-black border-white text-white text-black rounded-lg font-bold transform hover:-translate-y-1 transition duration-400',
      },
    },
    defaultVariants: {
      variant: 'primary',
      block: false,
    },
  }
);

const Button = ({ variant, block ,children, ...otherprops }: ButtonProp) => {
  const router = useRouter();

  const gotochat = () => {
    if(variant === 'secondary') {
      router.push("/chat")
    }
  }
  return (
    <button
      className={`${classes({ variant, block })} ${
        variant === "secondary"
          ? "border-2 border-gradient-to-r from-amber-300 via-teal-300 to-fuchsia-400 border-transparent p-[1px]"
          : ""
      }`}
      onClick={gotochat}
      {...otherprops}
    >
      {variant === "primary" ? (
        <div className="relative">
          <span className="text-gray-950 font-bold rounded transition-all duration-300">
            {children}
          </span>
          {/* Shimmer Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-50 transition-all duration-500 rounded-lg pointer-events-none animate-shimmer"></div>
        </div>
      ) : (
        <span
          className={
            variant === "secondary"
              ? "bg-gray-100 block rounded-lg px-5 py-[7px] text-center"
              : ""
          }
        >
          {children}
        </span>
      )}
    </button>
  );
};

export default Button;
