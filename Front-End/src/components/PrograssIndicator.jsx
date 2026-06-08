import { FaFingerprint } from "react-icons/fa";
import { HiOutlineUsers } from "react-icons/hi";
import { AiOutlineUser, AiOutlineCheckCircle } from "react-icons/ai";
import { motion } from "framer-motion";

const MotionDiv = motion.div;
const MotionButton = motion.button;

const defaultSteps = [
  { id: "personal", label: "شخصي معلومات", icon: AiOutlineUser },
  { id: "relatives", label: "د خپلوانو معلومات", icon: HiOutlineUsers },
  { id: "biometrics", label: "بایومتریک معلومات", icon: FaFingerprint },
];

export default function ProgressIndicator({
  currentStep = 0,
  maxReached = 0,
  onStepChange,
  steps = defaultSteps,
  dir = "rtl",
}) {
  const resolvedSteps = (steps?.length ? steps : defaultSteps).map(
    (step, index) => ({
      ...defaultSteps[index],
      ...step,
      id: step.id ?? defaultSteps[index]?.id ?? String(index),
      label: step.label ?? defaultSteps[index]?.label ?? `Step ${index + 1}`,
      icon: step.icon || defaultSteps[index]?.icon || AiOutlineUser,
    }),
  );

  const progressPercent =
    resolvedSteps.length > 1
      ? (currentStep / (resolvedSteps.length - 1)) * 100
      : 0;

  return (
    <div className="flex w-full justify-center py-3 font-persian" dir={dir}>
      <div className="relative w-full px-6">
        {/* ===== Progress Line Background ===== */}
        <div className="absolute top-1/4 w-[80%] mx-auto -translate-y-2/4 left-6 right-6 h-[2px] rounded-full bg-light-divider dark:bg-dark-divider">
          <MotionDiv
            className="h-full rounded-full bg-(--color-light-btn-primary-bg) dark:bg-(--color-dark-btn-primary-bg)"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        </div>

        {/* ===== Steps ===== */}
        <div className="relative z-10 flex justify-between">
          {resolvedSteps.map((step, index) => {
            const isCompleted = currentStep > index;
            const isCurrent = currentStep === index;
            const isUnlocked = index <= maxReached;

            return (
              <div
                key={step.id}
                className="flex flex-col items-center text-center"
              >
                <MotionButton
                  type="button"
                  onClick={() => isUnlocked && onStepChange?.(index)}
                  disabled={!isUnlocked}
                  className={[
                    "flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/15 dark:focus-visible:ring-blue-400/15",
                    isCompleted
                      ? "text-white border-transparent bg-(--color-light-btn-primary-bg) dark:bg-(--color-dark-btn-primary-bg)"
                      : isCurrent
                        ? "bg-(--color-light-input-bg) border-(--color-light-input-border-focus) text-(--color-light-text-primary) " +
                          "dark:bg-(--color-dark-input-bg) dark:border-(--color-dark-input-border-focus) dark:text-(--color-dark-text-primary)"
                        : isUnlocked
                          ? "bg-(--color-light-card-bg) border-(--color-light-input-border) text-light-text-secondary " +
                            "dark:bg-(--color-dark-card-bg) dark:border-dark-input-border dark:text-dark-text-secondary"
                          : "bg-(--color-light-card-bg) border-light-divider text-(--color-light-text-muted) cursor-not-allowed " +
                            "dark:bg-(--color-dark-card-bg) dark:border-dark-divider dark:text-dark-text-muted",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  animate={{ scale: isCurrent ? 1.15 : 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  {isCompleted ? (
                    <AiOutlineCheckCircle className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </MotionButton>

                <p
                  className={[
                    "mt-2 text-[13px] font-medium rtl:font-persian max-w-[120px] leading-snug",
                    isCompleted || isCurrent
                      ? "text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)"
                      : "text-(--color-light-text-muted) dark:text-dark-text-muted",
                  ].join(" ")}
                >
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
