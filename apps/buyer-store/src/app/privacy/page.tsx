import InfoPage from "@/components/InfoPage";

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Privacy Policy"
      intro="Aurenza uses customer information only to support accounts, orders, payments, delivery, and service communication."
      sections={[
        {
          heading: "Information We Use",
          body: "We may use your name, email, phone number, shipping address, and order details to complete purchases.",
        },
        {
          heading: "Payments",
          body: "Payment processing is handled through secure payment providers. Aurenza does not store card details.",
        },
        {
          heading: "Delivery",
          body: "Shipping information may be shared with logistics partners for pickup, tracking, and delivery.",
        },
        {
          heading: "Contact",
          body: "For privacy questions, contact support@aurenzashop.in.",
        },
      ]}
    />
  );
}
