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
  TextRevealCardTitle
} from "@/components/ui/text-reveal-card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useForm, FormProvider } from "react-hook-form";
import { motion } from "framer-motion";

const Page = () => {
  const form = useForm({
    defaultValues: {
      feedback: ""
    }
  });

  interface FeedbackData {
    feedback: string;
  }

  const handleSubmit = (data: FeedbackData): void => {
    if (!data.feedback.trim()) {
      toast.error("You sent an empty message! Please write something.");
    } else {
      toast.success("Your message has been sent to the founder", {
        description:
          "Anything else on your mind? Write it again, and we'll catch it! 😊"
      });
      console.log("Feedback Submitted:", data.feedback);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] px-4 py-16">
      {/* Glow effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 transform -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 opacity-20 blur-3xl rounded-full z-0" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-3xl bg-white/10 border border-white/20 backdrop-blur-2xl shadow-2xl rounded-2xl p-6 sm:p-10 text-white"
      >
            {/* Desktop animated title */}
            <div className="hidden sm:block mb-8">
                <TextRevealCard
                        className="items-center justify-center ml-7"
                        text="We need Your Help!"
                        revealText="We Need Your Feedback"
                    >
                        <TextRevealCardTitle className="text-center text-white">
                        Your Feedback is very Valuable for Us!
                        </TextRevealCardTitle>
                </TextRevealCard>
            </div>

            {/* Mobile fallback title */}
            <div className="sm:hidden text-center text-white text-lg font-semibold mb-6">
            Your Feedback is very Valuable for Us!
            </div>

        <FormProvider {...form}>
          <form
            className="space-y-6"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <FormField
              name="feedback"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-purple-200 text-md font-medium">
                    Share your thoughts
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Your voice matters! Share your feedback 💬💡"
                      className="resize-none text-white bg-white/5 border border-white/20 focus:border-purple-400 focus:ring-2 focus:ring-purple-400 placeholder:text-white/60"
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-sm text-white/70">
                    Your input helps us shape the future. Feel free to @mention ideas!
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  type="submit"
                  variant="ghost"
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all shadow-md"
                >
                  Send Feedback 🚀
                </Button>
              </motion.div>
            </div>
          </form>
        </FormProvider>
      </motion.div>
    </div>
  );
};

export default Page;
