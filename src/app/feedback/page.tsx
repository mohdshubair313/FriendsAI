"use client";

import { Button } from "@/components/ui/button";
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form";
import {
    TextRevealCard,
    TextRevealCardTitle,
} from "@/components/ui/text-reveal-card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useForm, FormProvider } from "react-hook-form"; // Import useForm


const page = () => {

    const form = useForm({
        defaultValues: {
          feedback: "", 
        },
    });

    interface FeedbackData {
        feedback: string;
    }

    const handleSubmit = (data: FeedbackData): void => {
        if (!data.feedback.trim()) {
            // If the input is empty or only spaces
            toast.error("You sent an empty message! Please write something.");
        } else {
            // If the input has valid data
            toast.success("Your message has been sent to the founder", {
                description:
                    "Anything else on your mind? Write it again, and we'll catch it! 😊",
            });
            console.log("Feedback Submitted:", data.feedback); // Log the message
        }
    };

  return (
    <div className="bg-gray-950 h-screen ml-10 mt-10">
        <div className="align-middle"> 
            <TextRevealCard
                className="items-center"
                text="We need Your Help!"
                revealText="We Need Your Feedback"
                >
             <TextRevealCardTitle>Your Feedback is very Valuable for Us!</TextRevealCardTitle>
            </TextRevealCard>
        </div>

        <FormProvider {...form}>
            <form className="mt-10 w-2/3 space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
                <FormField
                name="feedback"
                control={form.control}
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>FeedBack</FormLabel>
                    <FormControl>
                        <Textarea
                        placeholder="Your voice matters! Share your feedback and help us shape the future of AI friendships! 💬💡"
                        className="resize-none"
                        {...field}
                        />
                    </FormControl>
                    <FormDescription>
                        You can <span>@mention</span> other users and organizations.
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button variant="ghost">
                   Send Feedback
                </Button>
            </form>
    </FormProvider>
  </div>
  )
}

export default page