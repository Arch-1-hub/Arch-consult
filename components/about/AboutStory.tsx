import { site } from "@/lib/constants";

export default function AboutStory() {
  return (
    <section className="border-b border-ink-line py-20 lg:py-28">
      <div className="container-arch grid gap-12 lg:grid-cols-2 lg:gap-20">
        <div>
          <p className="eyebrow">Mission</p>
          <h2 className="mt-4 font-display text-3xl text-paper-white sm:text-4xl">
            Direction, before decoration.
          </h2>
        </div>
        <div className="flex flex-col gap-5">
          <p className="text-[15px] leading-relaxed text-ash">
            {site.name} exists to help businesses build stronger brands, make
            smarter strategic decisions, and turn ideas into businesses with
            clear direction and growth potential.
          </p>
          <p className="text-[15px] leading-relaxed text-ash">
            The consultancy combines branding, business strategy, digital
            strategy, AI, marketing and positioning, business growth, and
            entrepreneurial advisory — into a single, coherent practice
            rather than a set of disconnected services.
          </p>
          <p className="text-[15px] leading-relaxed text-ash">
            The long-term vision is for {site.name} to become a
            technology-enabled consultancy platform where businesses can
            interact with the brand, receive strategic guidance, access
            intelligent digital tools, and eventually connect with
            consultants directly.
          </p>
        </div>
      </div>
    </section>
  );
}
