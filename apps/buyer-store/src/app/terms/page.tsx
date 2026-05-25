import InfoPage from "@/components/InfoPage";

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Terms of Service"
      intro="These terms describe the basic conditions for using Aurenza and purchasing products from Aurenzashop.in."
      sections={[
        {
          heading: "Brand",
          body: "All storefront, order, invoice, and service communication is provided under the Aurenza brand.",
        },
        {
          heading: "Orders",
          body: "Orders are accepted subject to product availability, successful payment or COD eligibility, and serviceability.",
        },
        {
          heading: "Product Information",
          body: "We aim to keep prices, stock, descriptions, and images accurate, but minor differences may occur.",
        },
        {
          heading: "Support",
          body: "For order help or disputes, contact support@aurenzashop.in with the relevant details.",
        },
      ]}
    />
  );
}
