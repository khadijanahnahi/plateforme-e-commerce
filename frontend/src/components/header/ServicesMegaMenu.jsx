import MegaMenuColumn from "./MegaMenuColumn";
import { serviceGroups } from "./navigationConfig";

export default function ServicesMegaMenu({ onNavigate }) {
  return (
    <div className="client-services-mega-layout">
      {serviceGroups.map((group) => (
        <MegaMenuColumn key={group.title} {...group} onNavigate={onNavigate} />
      ))}
    </div>
  );
}

