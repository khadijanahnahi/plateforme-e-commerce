import { useEffect, useState } from "react";
import { adminProductsApi, getApiErrorMessage } from "../../api/adminProductsApi";
import { Button } from "../ui";

function Report({ report }) {
  if (!report) return null;

  return (
    <section className="product-import-report" aria-live="polite">
      <div className="product-import-metrics">
        <div><span>Lignes</span><strong>{report.totalRows}</strong></div>
        <div><span>Valides</span><strong>{report.validCount}</strong></div>
        <div><span>Importés</span><strong>{report.importedCount}</strong></div>
        <div className={report.failedCount ? "has-errors" : ""}><span>Erreurs</span><strong>{report.failedCount}</strong></div>
      </div>

      <div className="product-import-table-wrap">
        <table className="product-import-table">
          <thead>
            <tr><th>Ligne</th><th>SKU</th><th>Produit</th><th>État</th><th>Détail</th></tr>
          </thead>
          <tbody>
            {report.rows.map((row) => (
              <tr key={`${row.rowNumber}-${row.sku}`}>
                <td>{row.rowNumber}</td>
                <td>{row.sku || "-"}</td>
                <td>{row.name || "-"}</td>
                <td><span className={`product-import-status is-${row.status.toLowerCase()}`}>{row.status}</span></td>
                <td>{row.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function ProductImportModal({ onClose, onImported, open }) {
  const [catalog, setCatalog] = useState(null);
  const [images, setImages] = useState(null);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [busyMode, setBusyMode] = useState("");

  useEffect(() => {
    if (open) return;
    setCatalog(null);
    setImages(null);
    setReport(null);
    setError("");
    setBusyMode("");
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    function closeOnEscape(event) {
      if (event.key === "Escape" && !busyMode) onClose();
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [busyMode, onClose, open]);

  if (!open) return null;

  function buildFormData() {
    const formData = new FormData();
    formData.append("catalog", catalog);
    if (images) formData.append("images", images);
    return formData;
  }

  async function runImport(dryRun) {
    if (!catalog) {
      setError("Sélectionnez le catalogue CSV.");
      return;
    }
    setBusyMode(dryRun ? "check" : "import");
    setError("");
    try {
      const response = await adminProductsApi.importProducts(buildFormData(), dryRun);
      setReport(response.data);
      if (!dryRun) await onImported(response.data);
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Impossible de traiter le catalogue."));
    } finally {
      setBusyMode("");
    }
  }

  async function downloadTemplate() {
    setError("");
    try {
      const response = await adminProductsApi.downloadImportTemplate();
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = "shopsphere-products-template.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Impossible de télécharger le modèle CSV."));
    }
  }

  function changeCatalog(event) {
    setCatalog(event.target.files?.[0] ?? null);
    setReport(null);
    setError("");
  }

  function changeImages(event) {
    setImages(event.target.files?.[0] ?? null);
    setReport(null);
    setError("");
  }

  const canImport = report?.dryRun && report.validCount > 0;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={() => !busyMode && onClose()}>
      <div className="product-import-modal" role="dialog" aria-modal="true" aria-labelledby="product-import-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="product-import-header">
          <div>
            <span className="section-kicker">Import catalogue</span>
            <h2 id="product-import-title">Ajouter jusqu’à 100 produits</h2>
            <p>Un CSV contient les informations. Le ZIP contient une photo par produit, reliée par son nom de fichier.</p>
          </div>
          <Button size="sm" variant="ghost" disabled={Boolean(busyMode)} onClick={onClose}>Fermer</Button>
        </header>

        {error ? <div className="admin-alert" role="alert">{error}</div> : null}

        <div className="product-import-guide">
          <div><strong>1</strong><span>Téléchargez puis complétez le modèle CSV.</span></div>
          <div><strong>2</strong><span>Placez les images référencées dans une archive ZIP.</span></div>
          <div><strong>3</strong><span>Vérifiez le lot avant de lancer l’import réel.</span></div>
        </div>

        <div className="product-import-files">
          <label className="product-import-file">
            <span>Catalogue CSV <b>obligatoire</b></span>
            <input type="file" accept=".csv,text/csv" onChange={changeCatalog} />
            <small>{catalog?.name || "Aucun fichier sélectionné"}</small>
          </label>
          <label className="product-import-file">
            <span>Photos ZIP <b>si images locales</b></span>
            <input type="file" accept=".zip,application/zip" onChange={changeImages} />
            <small>{images?.name || "Facultatif si le CSV contient des URL HTTPS"}</small>
          </label>
        </div>

        <div className="product-import-note">
          <strong>Correspondance des photos</strong>
          <p>La colonne <code>image</code> doit contenir le nom exact, par exemple <code>TSHIRT-BLK-001.webp</code>. Les catégories doivent déjà exister et être actives.</p>
        </div>

        <div className="product-import-actions">
          <Button variant="outline" onClick={downloadTemplate}>Télécharger le modèle CSV</Button>
          <Button loading={busyMode === "check"} disabled={!catalog || Boolean(busyMode)} onClick={() => runImport(true)}>Vérifier le lot</Button>
          <Button loading={busyMode === "import"} disabled={!canImport || Boolean(busyMode)} onClick={() => runImport(false)}>
            Importer {report?.validCount || 0} produit{report?.validCount > 1 ? "s" : ""}
          </Button>
        </div>

        <Report report={report} />
      </div>
    </div>
  );
}
