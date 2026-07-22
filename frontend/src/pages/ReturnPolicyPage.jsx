import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { returnRequestApi } from "../api/returnRequestApi";
import { AsyncState, Button, Select, Textarea } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import { useToastContext } from "../contexts/ToastContext";

const REASONS = [
  { value: "DAMAGED", label: "Produit endommagé" },
  { value: "WRONG_PRODUCT", label: "Produit incorrect" },
  { value: "NOT_AS_DESCRIBED", label: "Ne correspond pas à la description" },
  { value: "SIZE_OR_FIT", label: "Taille ou coupe inadaptée" },
  { value: "CHANGED_MIND", label: "Changement d’avis" },
  { value: "OTHER", label: "Autre motif" },
];

const STATUS_LABELS = {
  REQUESTED: "Demande envoyée",
  UNDER_REVIEW: "En cours d’étude",
  APPROVED: "Retour accepté",
  REJECTED: "Retour refusé",
  RECEIVED: "Produit reçu",
  COMPLETED: "Demande finalisée",
  CANCELLED: "Demande annulée",
};

const POLICY_SECTIONS = [
  {
    number: "01",
    title: "Vérifier l’éligibilité",
    text: "La commande doit être livrée et payée. Les produits déjà associés à une demande ne sont plus proposés dans le formulaire.",
  },
  {
    number: "02",
    title: "Conserver l’article",
    text: "Gardez le produit dans son état d’origine, avec ses accessoires et son emballage lorsque cela est possible.",
  },
  {
    number: "03",
    title: "Attendre la validation",
    text: "N’expédiez rien avant la réponse de notre équipe. Les instructions apparaîtront dans le suivi de votre demande.",
  },
];

function formatMoney(value) {
  return `${Number(value ?? 0).toFixed(2)} DH`;
}

function formatDate(value) {
  if (!value) return "Date indisponible";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function getErrorMessage(error) {
  return error?.response?.data?.message ?? "La demande n’a pas pu être traitée. Veuillez réessayer.";
}

function ReturnIcon({ type }) {
  const paths = {
    package: <><path d="m4 7 8-4 8 4-8 4-8-4Z" /><path d="M4 7v10l8 4 8-4V7M12 11v10" /></>,
    shield: <><path d="M12 3 5 6v5c0 4.6 2.9 8.1 7 10 4.1-1.9 7-5.4 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
    return: <><path d="M9 7 4 12l5 5" /><path d="M4 12h10a6 6 0 0 1 6 6" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">{paths[type]}</svg>;
}

function RequestHistory({ requests, onCancel, cancellingId }) {
  return (
    <section className="return-history" aria-labelledby="return-history-title">
      <div className="return-section-heading">
        <div>
          <span className="section-kicker">Suivi personnel</span>
          <h2 id="return-history-title">Mes demandes</h2>
        </div>
        <span>{requests.length} {requests.length > 1 ? "demandes" : "demande"}</span>
      </div>

      <div className="return-history-list">
        {requests.map((request, index) => (
          <article className="return-history-card" style={{ "--return-delay": `${index * 70}ms` }} key={request.id}>
            <div className="return-history-product">
              <div className="return-history-image">
                {request.productImageUrl
                  ? <img src={request.productImageUrl} alt="" loading="lazy" />
                  : <ReturnIcon type="package" />}
              </div>
              <div>
                <span>{request.orderNumber}</span>
                <h3>{request.productName}</h3>
                <p>{request.quantity} × {formatMoney(request.unitPrice)}</p>
              </div>
            </div>

            <div className="return-history-meta">
              <span className={`return-status return-status-${request.status.toLowerCase()}`}>
                {STATUS_LABELS[request.status] ?? request.status}
              </span>
              <small>{formatDate(request.createdAt)}</small>
            </div>

            <div className="return-history-note">
              <span>Motif</span>
              <strong>{REASONS.find((reason) => reason.value === request.reason)?.label ?? request.reason}</strong>
              {request.adminNote ? <p>{request.adminNote}</p> : <p>Notre équipe vous informera de la prochaine étape ici.</p>}
            </div>

            {request.status === "REQUESTED" ? (
              <Button
                loading={cancellingId === request.id}
                size="sm"
                variant="ghost"
                onClick={() => onCancel(request.id)}
              >
                Annuler la demande
              </Button>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export default function ReturnPolicyPage() {
  const { authLoading, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToastContext();
  const [form, setForm] = useState({ orderItemId: "", quantity: "1", reason: "", details: "" });

  const eligibleQuery = useQuery({
    queryKey: ["return-requests", "eligible-items"],
    queryFn: () => returnRequestApi.getEligibleItems().then((response) => response.data),
    enabled: isAuthenticated,
  });
  const requestsQuery = useQuery({
    queryKey: ["return-requests", "mine"],
    queryFn: () => returnRequestApi.getMyRequests().then((response) => response.data),
    enabled: isAuthenticated,
  });

  const selectedItem = (eligibleQuery.data ?? []).find((item) => String(item.orderItemId) === form.orderItemId);
  const formIsValid = selectedItem
    && form.reason
    && form.details.trim().length >= 10
    && Number(form.quantity) >= 1
    && Number(form.quantity) <= selectedItem.purchasedQuantity;

  const createMutation = useMutation({
    mutationFn: (payload) => returnRequestApi.create(payload),
    onSuccess: async () => {
      setForm({ orderItemId: "", quantity: "1", reason: "", details: "" });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["return-requests", "eligible-items"] }),
        queryClient.invalidateQueries({ queryKey: ["return-requests", "mine"] }),
      ]);
      toast.success("Votre demande de retour a bien été envoyée.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => returnRequestApi.cancel(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["return-requests", "eligible-items"] }),
        queryClient.invalidateQueries({ queryKey: ["return-requests", "mine"] }),
      ]);
      toast.success("La demande a été annulée.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "orderItemId" ? { quantity: "1" } : {}),
    }));
  }

  function submitReturn(event) {
    event.preventDefault();
    if (!formIsValid || createMutation.isPending) return;
    createMutation.mutate({
      orderItemId: Number(form.orderItemId),
      quantity: Number(form.quantity),
      reason: form.reason,
      details: form.details.trim(),
    });
  }

  return (
    <main className="return-page">
      <section className="return-hero">
        <div className="return-hero-copy">
          <span className="section-kicker">Retours ShopSphere</span>
          <h1>Un retour simple,<br /><em>suivi à chaque étape.</em></h1>
          <p>Déclarez un article depuis une commande finalisée. L’éligibilité, la quantité et le propriétaire de la commande sont vérifiés directement par ShopSphere.</p>
          <div className="return-hero-actions">
            <a className="button button-primary" href="#return-request">Démarrer une demande</a>
            <Link className="button button-secondary" to="/support">Contacter le support</Link>
          </div>
        </div>

        <div className="return-hero-visual" aria-hidden="true">
          <span className="return-orbit return-orbit-one" />
          <span className="return-orbit return-orbit-two" />
          <div className="return-visual-mark"><ReturnIcon type="return" /></div>
          <p>Demande sécurisée</p>
          <strong>Vérification côté serveur</strong>
        </div>
      </section>

      <section className="return-trust-grid" aria-label="Garanties de retour">
        <article><ReturnIcon type="package" /><div><strong>Commande vérifiée</strong><span>Produit réellement acheté</span></div></article>
        <article><ReturnIcon type="shield" /><div><strong>Données protégées</strong><span>Accès réservé à votre compte</span></div></article>
        <article><ReturnIcon type="return" /><div><strong>Suivi centralisé</strong><span>Statut visible en temps réel</span></div></article>
      </section>

      <section className="return-content">
        <div className="return-policy-panel">
          <span className="section-kicker">Avant de commencer</span>
          <h2>Comment fonctionne un retour ?</h2>
          <p className="return-policy-intro">Une demande ne vaut pas acceptation immédiate. Notre équipe vérifie son éligibilité avant de communiquer les instructions de retour.</p>

          <div className="return-policy-steps">
            {POLICY_SECTIONS.map((section, index) => (
              <article style={{ "--return-delay": `${index * 90}ms` }} key={section.number}>
                <span>{section.number}</span>
                <div><h3>{section.title}</h3><p>{section.text}</p></div>
              </article>
            ))}
          </div>

          <details className="return-policy-details">
            <summary>Conditions importantes <span aria-hidden="true">+</span></summary>
            <div>
              <p>Les articles utilisés, altérés, incomplets ou exclus pour des raisons d’hygiène peuvent être refusés après contrôle.</p>
              <p>Pour un produit défectueux ou incorrect, décrivez précisément le problème. Le support pourra demander des justificatifs avant validation.</p>
              <p>Le remboursement ou l’échange dépend de la décision finale et du mode de paiement utilisé lors de la commande.</p>
            </div>
          </details>
        </div>

        <section className="return-request-panel" id="return-request" aria-labelledby="return-request-title">
          <div className="return-request-heading">
            <span className="section-kicker">Espace client</span>
            <h2 id="return-request-title">Demander un retour</h2>
            <p>Sélectionnez un article livré et payé. Aucun prix ni statut n’est accepté depuis le navigateur.</p>
          </div>

          {authLoading ? (
            <div className="return-auth-loading" role="status">Vérification de votre session…</div>
          ) : !isAuthenticated ? (
            <div className="return-login-state">
              <div><ReturnIcon type="shield" /></div>
              <h3>Connexion requise</h3>
              <p>Connectez-vous pour retrouver vos achats éligibles et suivre vos demandes.</p>
              <Link className="button button-primary" to="/login">Se connecter</Link>
            </div>
          ) : (
            <AsyncState
              loading={eligibleQuery.isLoading}
              error={eligibleQuery.error ? getErrorMessage(eligibleQuery.error) : null}
              onRetry={eligibleQuery.refetch}
              skeletonCount={2}
            >
              {(eligibleQuery.data ?? []).length === 0 ? (
                <div className="return-no-eligible">
                  <ReturnIcon type="package" />
                  <h3>Aucun article éligible actuellement</h3>
                  <p>Seuls les articles de commandes livrées et payées, sans demande existante, sont disponibles.</p>
                  <Link to="/orders">Consulter mes commandes <span aria-hidden="true">→</span></Link>
                </div>
              ) : (
                <form className="return-form" onSubmit={submitReturn}>
                  <Select
                    fullWidth
                    label="Article à retourner"
                    name="orderItemId"
                    value={form.orderItemId}
                    onChange={updateField}
                    placeholder="Choisir une commande et un produit"
                    options={(eligibleQuery.data ?? []).map((item) => ({
                      value: String(item.orderItemId),
                      label: `${item.orderNumber} · ${item.productName}`,
                    }))}
                  />

                  {selectedItem ? (
                    <div className="return-selected-product">
                      <div>{selectedItem.productImageUrl ? <img src={selectedItem.productImageUrl} alt="" /> : <ReturnIcon type="package" />}</div>
                      <span><strong>{selectedItem.productName}</strong><small>{selectedItem.orderNumber} · {formatDate(selectedItem.orderDate)}</small></span>
                      <b>{formatMoney(selectedItem.unitPrice)}</b>
                    </div>
                  ) : null}

                  <div className="return-form-row">
                    <Select
                      fullWidth
                      disabled={!selectedItem}
                      label="Quantité"
                      name="quantity"
                      value={form.quantity}
                      onChange={updateField}
                      options={Array.from({ length: selectedItem?.purchasedQuantity ?? 1 }, (_, index) => ({
                        value: String(index + 1),
                        label: String(index + 1),
                      }))}
                    />
                    <Select
                      fullWidth
                      label="Motif du retour"
                      name="reason"
                      value={form.reason}
                      onChange={updateField}
                      placeholder="Sélectionner un motif"
                      options={REASONS}
                    />
                  </div>

                  <Textarea
                    fullWidth
                    label="Expliquez votre demande"
                    name="details"
                    value={form.details}
                    onChange={updateField}
                    minLength={10}
                    maxLength={1000}
                    placeholder="Décrivez l’état du produit et la solution souhaitée…"
                    helperText={`${form.details.length}/1000 caractères · minimum 10`}
                  />

                  <Button fullWidth loading={createMutation.isPending} disabled={!formIsValid} type="submit">
                    Envoyer la demande
                  </Button>
                  <p className="return-form-security"><ReturnIcon type="shield" /> La demande est liée à votre compte et à la commande sélectionnée.</p>
                </form>
              )}
            </AsyncState>
          )}
        </section>
      </section>

      {isAuthenticated ? (
        <AsyncState
          loading={requestsQuery.isLoading}
          error={requestsQuery.error ? getErrorMessage(requestsQuery.error) : null}
          onRetry={requestsQuery.refetch}
          empty={(requestsQuery.data ?? []).length === 0}
          emptyTitle="Aucune demande de retour"
          emptyDescription="Vos futures demandes et leurs statuts apparaîtront dans cet espace."
        >
          <RequestHistory
            requests={requestsQuery.data ?? []}
            cancellingId={cancelMutation.isPending ? cancelMutation.variables : null}
            onCancel={(id) => !cancelMutation.isPending && cancelMutation.mutate(id)}
          />
        </AsyncState>
      ) : null}

      <section className="return-support-cta">
        <div><span className="section-kicker">Une situation particulière ?</span><h2>Notre équipe reste disponible.</h2></div>
        <p>Pour une commande incorrecte, un défaut ou une question avant l’envoi, transmettez votre numéro de commande au support.</p>
        <Link className="button button-secondary" to="/support">Ouvrir le support</Link>
      </section>
    </main>
  );
}
