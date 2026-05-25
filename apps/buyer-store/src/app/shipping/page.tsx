import InfoPage from "@/components/InfoPage";

export default function ShippingPage() {
  return (
    <InfoPage
      eyebrow="Delivery"
      title="Shipping & Returns"
      intro="Aurenza prepares orders carefully and keeps buyers informed with packing, shipping, and delivery updates."
      sections={[
        {
          heading: "Shipping",
          body: "Orders are packed after confirmation and assigned a shipment through the logistics workflow.",
        },
        {
          heading: "Tracking",
          body: "Tracking history appears in your profile when shipment events are available.",
        },
        {
          heading: "Returns",
          body: "If an item arrives damaged or incorrect, contact support with photos and order details.",
        },
        {
          heading: "Address Accuracy",
          body: "Please provide a complete phone number, street address, city, state, and pin code before checkout.",
        },
      ]}
    />
  );
}
