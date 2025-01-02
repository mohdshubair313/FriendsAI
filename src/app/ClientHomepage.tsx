"use client";

import { useState, useEffect } from "react";
import Calltoactions from "@/sections/CallToAction";
import Companies from "@/sections/Companies";
import Features from "@/sections/Features";
import Footer from "@/sections/Footer";
import Header from "@/sections/Header";
import Hero from "@/sections/Hero";
import Pricing from "@/sections/Pricing";
import Testimonials from "@/sections/Testimonials";
import Popup from "@/components/popup";
import Loader from "@/components/Loader"

export default function ClientHomepage({user}: {user: any}) {
    const [isloading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    // If the loading state is true, show a loading screen means if still loading then show the loading screen
    if(isloading) {
        return <Loader />
    }

  return (
    <>
    {/* If the user is logged in, show the homepage without the popup */}
    {user ? (
        <>
        <Header />
        <Hero />
        <Companies />
        <Features />
        <Pricing />
        <Testimonials />
        <Calltoactions />
        <Footer />
        </>
    ) : (
        <>
        <Popup />
        <Header />
        <Hero />
        <Companies />
        <Features />
        <Pricing />
        <Testimonials />
        <Calltoactions />
        <Footer />
        </>
    )}
    </>
  );
}
