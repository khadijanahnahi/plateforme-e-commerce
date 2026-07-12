import { StatusBadge } from "../ui";

export default function SupportMessageStatusBadge({ status }) {
  return <StatusBadge type="support" value={status} />;
}
