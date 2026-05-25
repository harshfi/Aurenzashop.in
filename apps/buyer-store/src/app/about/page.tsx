import InfoPage from "@/components/InfoPage";

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow="About Aurenza"
      title="Modern Indian Style, Curated With Care"
      intro="Aurenza is a clothing and lifestyle brand focused on premium quality, elegant design, and dependable shopping support."
      sections={[
        {
          heading: "What We Offer",
          body: "From everyday ethnic wear to statement wall designs, we curate products that elevate your personal style and living spaces.",
        },
        {
          heading: "Quality Promise",
          body: "Every listing is selected for material quality, visual appeal, and practical usability so you can shop with confidence.",
        },
        {
          heading: "Customer-First Support",
          body: "Order updates, tracking transparency, and responsive communication are core parts of the Aurenza shopping experience.",
        },
        {
          heading: "Business Identity",
          body: "Aurenza is operated by Hemlata Dubey as a sole proprietorship.",
        },
      ]}
    />
  );
}
