"use client";

// import Link from "next/link";
import { Button } from "ui/button";
import { ArrowLeft, Home, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground relative overflow-hidden font-mono p-4">
      {/* Background Grid Effect */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03]" 
        style={{
             backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
             backgroundSize: '40px 40px'
        }}
      />
      
      {/* Spotlights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col items-center max-w-2xl w-full">
        {/* Header Section */}
        <div className="relative mb-8 text-center">
            {/* The Badge */}
            <div className="absolute -top-6 -right-12 rotate-12 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 shadow-lg transform hover:rotate-3 transition-transform duration-300">
                ERR_NOT_FOUND
            </div>
            
            {/* The Big Number */}
            <h1 className="text-[150px] leading-none font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/20 select-none">
                404
            </h1>
            
            {/* The Strike-through Effect (Cosmetic line) */}
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-primary/50 -rotate-6 blur-[1px]"></div>
        </div>

        {/* Content Box */}
        <div className="w-full bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-8 shadow-2xl relative overflow-hidden group">
            {/* Decorative corners */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary/50"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-primary/50"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-primary/50"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-primary/50"></div>

            <div className="flex flex-col items-center text-center gap-4">
                <div className="flex items-center gap-2 text-primary font-bold tracking-widest uppercase text-sm animate-pulse">
                    <TriangleAlert className="size-4" />
                    System Malfunction
                </div>

                <h2 className="text-2xl font-bold">Page Not Found</h2>
                
                <p className="text-muted-foreground max-w-md">
                    The requested resource could not be located in the current sector. It may have been moved, deleted, or never existed.
                </p>

                <div className="w-full h-px bg-border my-2"></div>

                <div className="flex justify-between w-full text-[10px] text-muted-foreground font-mono uppercase">
                    <span>Code: 0x404</span>
                    <span>Status: TERMINATED</span>
                </div>
            </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-8">
            <Button 
                onClick={() => router.push("/")}
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold min-w-[160px] border border-primary/20 shadow-[0_0_20px_-5px_rgba(0,0,0,0.3)] hover:shadow-[0_0_30px_-5px_rgba(var(--primary-rgb),0.5)] transition-all duration-300"
            >
                <Home className="mr-2 size-4" />
                RETURN TO BASE
            </Button>
            
             <Button 
                onClick={() => router.back()}
                variant="outline"
                size="lg"
                className="bg-transparent border-primary/20 hover:bg-primary/5 hover:text-primary min-w-[140px] font-mono uppercase text-xs tracking-wider"
            >
                <ArrowLeft className="mr-2 size-4" />
                GO BACK
            </Button>
        </div>
      </div>
      
      {/* Footer minimal */}
      <div className="absolute bottom-4 left-0 w-full text-center text-[10px] text-muted-foreground/30 font-mono">
        SYSTEM_ID: BETTER_CHATBOT_V1.2
      </div>
    </div>
  );
}
