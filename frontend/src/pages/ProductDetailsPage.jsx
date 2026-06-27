import { useParams } from "react-router-dom";

export default function ProductDetailsPage() {
  const { id } = useParams();

  return (
    <section className="page">
      <h1>Détail produit</h1>
      <p>Produit sélectionné : {id}</p>
    </section>
  );
}
