import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { seo } from "@/lib/site";

// Tradução da política em português (src/routes/privacidade.tsx). Ao mudar uma,
// mude a outra: as duas precisam dizer a mesma coisa.
export const Route = createFileRoute("/en/privacy")({
  head: () =>
    seo("/en/privacy", {
      title: "Privacy and Cookie Policy — Keystone",
      description:
        "Keystone's privacy and cookie policy, in line with Brazil's General Data Protection Law (LGPD).",
      noindex: true,
    }),
  component: PrivacyPageEn,
});

function PrivacyPageEn() {
  return (
    <div className="min-h-screen bg-navy text-cream">
      <SiteHeader locale="en" />
      <main>
        <section className="relative overflow-hidden px-8 pb-16 pt-36 lg:pt-44">
          <div className="relative z-10 mx-auto max-w-3xl">
            <span className="eyebrow">Privacy</span>
            <h1 className="section-title mt-7">
              <em>Privacy</em> and Cookie Policy
            </h1>
            <p className="mt-6 text-[13px] uppercase tracking-[0.15em] text-cream-mute">
              Last updated: November 2026
            </p>
          </div>
        </section>

        <section className="border-t border-border-sub py-16">
          <div className="mx-auto max-w-3xl space-y-10 px-8 text-[14.5px] leading-relaxed text-cream-dim">
            <Block title="1. Introduction">
              Keystone values the privacy and protection of the personal data of its visitors and
              clients. This policy explains, in plain terms, what data we collect on this site, how
              we use cookies and similar technologies, and what your rights are, in line with
              Brazil's General Data Protection Law (Law No. 13,709/2018 — LGPD). The Portuguese
              version of this policy prevails in case of any difference.
            </Block>

            <Block title="2. What data we collect">
              We may collect data you provide voluntarily in contact and diagnosis forms (such as
              name, email, phone number and information about your company), as well as browsing
              data collected automatically through cookies and similar technologies, such as IP
              address, device type, browser and pages visited.
            </Block>

            <Block title="3. Use of cookies">
              Cookies are small files stored in your browser that help us understand how the site is
              used, remember your preferences and improve your browsing experience. We use cookies
              that are essential for the site to work and, if you accept them in the cookie notice,
              HubSpot analytics cookies to measure traffic, understand which pages were visited and
              link that browsing to your contact record when you fill in a form, and the Meta pixel
              (Facebook and Instagram) to measure the results of our ads and show ads to people who
              have visited the site. If you decline, none of these cookies is loaded. You can also
              delete or block cookies in your browser settings, bearing in mind that this may affect
              some features of the site.
            </Block>

            <Block title="4. Purpose of processing">
              The data collected is used to respond to contact and diagnosis requests, improve the
              content and experience of the site, comply with legal and regulatory obligations and,
              where authorized, send communications about Keystone's services.
            </Block>

            <Block title="5. Data sharing">
              We do not sell your personal data. Data is shared only with service providers that
              support the operation of the site (such as Hostinger, which hosts the site and sends
              our email communications, Supabase, which stores form submissions, HubSpot, our CRM
              and analytics tool, and Meta, our advertising platform), always under confidentiality
              and security obligations, or when required by law.
            </Block>

            <Block title="6. Your rights">
              Under the LGPD, you have the right to confirm whether your data is processed, to
              access, correct or request the deletion of your personal data, to withdraw consent and
              to know with whom we share your information. To exercise these rights, contact us
              through the channels on our{" "}
              <Link to="/en/contact" className="text-gold hover:underline">
                Contact
              </Link>{" "}
              page.
            </Block>

            <Block title="7. Security">
              We adopt reasonable technical and organizational measures to protect the personal data
              collected against unauthorized access, loss, alteration or improper disclosure.
            </Block>

            <Block title="8. Changes to this policy">
              This policy may be updated from time to time to reflect improvements to the site or
              changes in applicable law. We recommend reviewing this page occasionally.
            </Block>

            <Block title="9. Contact">
              If you have questions about this policy or about how your personal data is processed,
              please get in touch through our{" "}
              <Link to="/en/contact" className="text-gold hover:underline">
                Contact
              </Link>{" "}
              page.
            </Block>
          </div>
        </section>
      </main>
      <SiteFooter locale="en" />
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-xl font-medium text-cream">{title}</h2>
      <p className="mt-3">{children}</p>
    </div>
  );
}
