import InfoPage from "@/components/InfoPage";

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow="About Aurenza"
      title="Modern Indian Couture, Curated With Care"
      intro="Aurenza is a premium direct-to-consumer fashion house focused on elevated ethnic craftsmanship, elegant tailoring, and dependable service."
      sections={[
        {
          heading: "What We Offer",
          body: "From timeless sarees to statement festive gowns and fusion silhouettes, every Aurenza edit is designed for modern Indian celebrations.",
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
