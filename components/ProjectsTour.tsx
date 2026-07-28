"use client";

import { ProductTour } from "@/components/ProductTour";

// Projects is the second least self-explanatory screen after the Study Hub:
// the cards look like a catalogue, so it is not obvious that each one is a real
// repo you clone, build and submit for a graded review. Mounted from the
// server-rendered projects page, which cannot host a client tour directly.
export function ProjectsTour() {
  return (
    <ProductTour
      id="projects"
      steps={[
        {
          title: "Projects are what you show employers",
          body:
            "Lessons teach the skill; projects prove it. Each track is built around real builds — not toy exercises — and finishing them is what turns your account into a portfolio.",
        },
        {
          target: "projects-header",
          title: "Your progress through the builds",
          body:
            "This counts the projects you have submitted and had graded. You do not have to do them in order, but they get harder as you go down a track.",
        },
        {
          target: "projects-list",
          title: "Every project is a real repository",
          body:
            "Open one and you get a brief, a starter repo with a real dataset, and the rubric you will be marked against. You clone it, build it, and push it to your own GitHub.",
        },
        {
          title: "Nova reviews it like a senior would",
          body:
            "Submit and Nova grades the work against that rubric — what is solid, what is missing, what a reviewer would flag. You can fix and resubmit. The score and the repo both land in your portfolio.",
        },
      ]}
    />
  );
}
