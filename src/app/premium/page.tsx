"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PremiumSuccessPopup from "@/components/PremiumSuccessPopup";

export default function PremiumPage() {
    const [isPopupOpen, setIsPopupOpen] = useState(true);
    const router = useRouter();

    const handleClose = () => {
        setIsPopupOpen(false);
        router.push("/chat");
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <PremiumSuccessPopup isOpen={isPopupOpen} onClose={handleClose} />
        </div>
    );
}
