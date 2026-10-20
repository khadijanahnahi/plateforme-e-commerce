import { StatusBadge } from "../ui";

export default function ReturnRequestStatusBadge({ status }) {
  return <StatusBadge type="return" value={status} />;
}
