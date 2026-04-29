import { cva } from "class-variance-authority"
import { HTMLAttributes } from "react";

const classes = cva('bg-gradient-to-b to-stone-950 rounded-full', {
    variants: {
        size: {
            sm: 'size-4',
            md: 'size-6',
            lg: 'size-8',
        },
        color: {
            amber: "from-amber-400",
            orange: "from-orange-400",
            gold: "from-yellow-500",
            violet: "from-amber-400",
            teal: "from-orange-300",
            fuchsia: "from-amber-500",
        },
    },
    defaultVariants: {
        size: "lg",
        color: "amber",
    },
})

export const Planet = (props: {
    size?: 'sm' | 'md' | 'lg';
    color?: 'violet' | 'teal' | 'fuchsia' | 'amber' | 'orange' | 'gold';
} & HTMLAttributes<HTMLDivElement>) => {
    return <div className={classes({
        size: props.size,
        color: props.color,
        className: props.className,
    })} />;
}
