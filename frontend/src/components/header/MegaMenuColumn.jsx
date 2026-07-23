import MegaMenuLink from "./MegaMenuLink";

export default function MegaMenuColumn({ emphasized = false, links, onNavigate, title }) {
  return (
    <section className={`client-mega-column ${emphasized ? "is-emphasized" : ""}`}>
      <p className="client-mega-eyebrow">{title}</p>
      <div className="client-mega-column-links">
        {links.map((link) => (
          <MegaMenuLink key={`${link.to}-${link.label}`} {...link} onNavigate={onNavigate} />
        ))}
      </div>
    </section>
  );
}

