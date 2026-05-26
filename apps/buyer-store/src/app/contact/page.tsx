import InfoPage from "@/components/InfoPage";

export default function ContactPage() {
  return (
    <InfoPage
      eyebrow="Support"
      title="Contact Aurenza"
      intro="Need help with sizing, orders, delivery, or exchanges? The Aurenza support desk is here to help."
      sections={[
        {
          heading: "Email Support",
          body: "Write to support@aurenzashop.in with your order details and we will respond as soon as possible.",
        },
        {
          heading: "Business Details",
          body: "Aurenza is operated by Hemlata Dubey as a sole proprietorship.",
        },
      ]}
    />
  );
}
