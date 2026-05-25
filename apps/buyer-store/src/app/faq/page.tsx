import InfoPage from "@/components/InfoPage";

export default function FaqPage() {
  return (
    <InfoPage
      eyebrow="Help"
      title="Frequently Asked Questions"
      intro="Quick answers about Aurenza products, checkout, orders, and delivery."
      sections={[
        {
          heading: "What does Aurenza sell?",
          body: "Aurenza offers premium clothing and elegant wallpapers for personal style and interior spaces.",
        },
        {
          heading: "Can I track my order?",
          body: "Yes. Once an order is packed and shipped, tracking updates are shown in your profile and sent by email.",
        },
        {
          heading: "Which payment options are supported?",
          body: "The platform is prepared for prepaid Razorpay checkout and cash-on-delivery workflows.",
        },
        {
          heading: "How do I contact support?",
          body: "Use the contact page or email support@aurenzashop.in with your order number and query.",
        },
      ]}
    />
  );
}
