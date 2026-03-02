"use client";

import React from "react";
import { motion } from "framer-motion";

interface Testimonial {
  text: string;
  image: string;
  name: string;
  role: string;
}

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, image, name, role }, i) => (
                <div
                  className="p-8 rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-sm max-w-xs w-full transition-colors hover:bg-white/[0.07]"
                  key={`${index}-${i}`}
                >
                  <div className="text-white/80 leading-relaxed text-[15px]">
                    {text}
                  </div>
                  <div className="flex items-center gap-3 mt-6">
                    <img
                      width={40}
                      height={40}
                      src={image}
                      alt={name}
                      className="h-10 w-10 rounded-full border border-white/20 object-cover"
                    />
                    <div className="flex flex-col">
                      <div className="font-bold text-white text-sm tracking-tight leading-tight">
                        {name}
                      </div>
                      <div className="text-white/40 text-xs mt-0.5 tracking-tight font-medium uppercase">
                        {role}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};
