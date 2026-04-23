import { brandTemplate } from "./brand";

export const emailTemplate = {
  brand: brandTemplate,
  theme: {
    background: "#0f1728",
    surface: "#152033",
    surfaceRaised: "#1b2a42",
    surfaceSoft: "#22324d",
    border: "#31415d",
    borderStrong: "#4f6788",
    text: "#f7fbff",
    textMuted: "#a8b6ca",
    primary: "#63c7ff",
    primaryDark: "#14324a",
    accent: "#f4c95d",
    success: "#6ee7b7",
  },
  customerMessage: {
    eyebrow: "New portal message",
    body: "A new message is waiting for you in the Dockyard portal.",
    preview: (subject: string) => `New message: ${subject}`,
    subject: (subject: string) => `New portal message: ${subject}`,
    textIntro: "You have a new message in your Dockyard portal.",
  },
  supportMessage: {
    eyebrow: "Portal inquiry",
    body: "A customer has sent a new message from the portal.",
    preview: (subject: string) => `Customer message: ${subject}`,
    subject: (subject: string) => `Customer portal message: ${subject}`,
  },
  customerWelcome: {
    eyebrow: "Account ready",
    title: "Your Dockyard portal is live",
    panelTitle: "Login details",
    buttonLabel: "Sign in to portal",
    temporaryPasswordLabel: "Temporary password",
    signInTextLabel: "Sign in",
    passwordNotice:
      "You will be asked to change this temporary password after your first sign-in.",
    body: (companyName: string) =>
      `The workspace for ${companyName} is ready. Use the temporary password below for your first sign-in.`,
    preview: (companyName: string) =>
      `Your Dockyard portal account for ${companyName}`,
    subject: (companyName: string) =>
      `Your Dockyard portal account for ${companyName}`,
    textIntro: (companyName: string) =>
      `Your Dockyard portal account for ${companyName} is ready.`,
  },
  document: {
    readyEyebrow: (label: string) => `${label} ready`,
    body: (documentType: "quote" | "invoice") =>
      `Your ${documentType} is ready to review in the Dockyard portal.`,
    buttonLabel: (label: string) => `View ${label}`,
    downloadLabel: "Download as PDF",
    preview: (label: string) => `Your ${label.toLowerCase()} is ready`,
    subject: (label: string, title: string) => `${label}: ${title}`,
  },
  formSubmission: {
    eyebrow: "Website submission",
    title: (formName: string) => `${formName} submission`,
    body: (submittedAt: string) => `Submitted at ${submittedAt}`,
    preview: (formName: string) => `${formName} submission`,
    subject: (formName: string) => `${formName} submission`,
  },
} as const;
