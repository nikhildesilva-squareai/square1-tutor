"use client";

import { useState } from "react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  action: string;
  icon: string;
  completed: boolean;
}

interface OnboardingFlowClientProps {
  userId: string;
  communityName: string;
  steps?: OnboardingStep[];
  onComplete?: () => void;
}

export function OnboardingFlowClient({
  userId,
  communityName,
  steps: initialSteps,
  onComplete,
}: OnboardingFlowClientProps) {
  const defaultSteps: OnboardingStep[] = [
    {
      id: "profile",
      title: "Complete Your Profile",
      description: "Add a profile picture and bio to help others get to know you",
      action: "Go to Profile",
      icon: "👤",
      completed: false,
    },
    {
      id: "follow",
      title: "Follow Members",
      description: "Follow 3+ members to personalize your feed",
      action: "Browse Members",
      icon: "👥",
      completed: false,
    },
    {
      id: "post",
      title: "Make Your First Post",
      description: "Share an introduction or ask a question",
      action: "Create Post",
      icon: "💬",
      completed: false,
    },
    {
      id: "message",
      title: "Send a Message",
      description: "Connect 1-on-1 with another member",
      action: "Send Message",
      icon: "✉️",
      completed: false,
    },
    {
      id: "invite",
      title: "Invite Friends",
      description: "Share the community with friends",
      action: "Share Community",
      icon: "🚀",
      completed: false,
    },
  ];

  const [steps, setSteps] = useState(initialSteps || defaultSteps);
  const [currentStep, setCurrentStep] = useState(0);
  const [skipped, setSkipped] = useState(false);

  const handleCompleteStep = async (stepId: string) => {
    try {
      await fetch(`/api/onboarding/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId }),
      });

      setSteps((prev) =>
        prev.map((step) =>
          step.id === stepId ? { ...step, completed: true } : step
        )
      );

      const nextIncomplete = steps.findIndex(
        (s) => !s.completed && s.id !== stepId
      );
      if (nextIncomplete >= 0) {
        setCurrentStep(nextIncomplete);
      } else {
        onComplete?.();
      }
    } catch (error) {
      console.error("Error completing step:", error);
    }
  };

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = (completedCount / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-neutral-50">
      <div className="max-w-2xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">
            Welcome to {communityName}! 👋
          </h1>
          <p className="text-lg text-neutral-600">
            Let's get you started with 5 quick steps
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between mb-2">
            <p className="text-sm font-medium text-neutral-900">
              Progress: {completedCount} of {steps.length}
            </p>
            <p className="text-sm font-medium text-blue-600">
              {Math.round(progressPercent)}%
            </p>
          </div>
          <div className="h-3 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-12">
          {steps.map((step, idx) => (
            <div
              key={step.id}
              className={`rounded-lg border-2 transition-all p-6 ${
                step.completed
                  ? "bg-green-50 border-green-200"
                  : currentStep === idx
                    ? "bg-blue-50 border-blue-400 ring-2 ring-blue-300"
                    : "bg-white border-neutral-200 hover:border-neutral-300"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div
                    className={`text-3xl flex-shrink-0 ${
                      step.completed ? "opacity-50" : ""
                    }`}
                  >
                    {step.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-neutral-900">
                        {step.title}
                      </h3>
                      {step.completed && (
                        <span className="inline-block w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">
                          ✓
                        </span>
                      )}
                    </div>
                    <p className="text-neutral-600 text-sm">
                      {step.description}
                    </p>
                  </div>
                </div>

                {!step.completed && (
                  <button
                    onClick={() => handleCompleteStep(step.id)}
                    className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors flex-shrink-0"
                  >
                    {step.action}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Skip Option */}
        {!skipped && (
          <div className="text-center">
            <button
              onClick={() => setSkipped(true)}
              className="text-neutral-600 hover:text-neutral-900 text-sm font-medium transition-colors"
            >
              Skip for now →
            </button>
          </div>
        )}

        {/* Completion Message */}
        {completedCount === steps.length && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-green-900 mb-2">
              🎉 You're All Set!
            </h2>
            <p className="text-green-700 mb-4">
              Welcome to the community. Start exploring posts, connecting with members, and
              sharing your thoughts!
            </p>
            <button
              onClick={onComplete}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Go to Community
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
