# Import catalogue produits

L'administration permet d'importer jusqu'à 100 produits depuis **Produits > Importer CSV + ZIP**.

## Fichiers

1. Téléchargez le modèle CSV depuis la modale d'import.
2. Ajoutez une ligne par produit sans modifier les noms de colonnes.
3. Placez les photos dans une archive ZIP. La colonne `image` doit contenir le nom exact de la photo.
4. Lancez **Vérifier le lot**, corrigez les lignes en erreur, puis lancez **Importer**.

Les catégories référencées doivent déjà exister et être actives. Chaque SKU doit être unique dans le fichier et dans la base.
Les séparateurs virgule et point-virgule sont acceptés pour rester compatibles avec Excel en français.

## Colonnes

- `name`, `price`, `sku`, `category` et `image` sont obligatoires.
- `status` accepte `DRAFT`, `ACTIVE`, `OUT_OF_STOCK` ou `ARCHIVED`. La valeur par défaut est `DRAFT`.
- `audience` accepte `UNISEXE`, `HOMME` ou `FEMME`.
- Utilisez `stock` pour un produit sans tailles.
- Pour un vêtement, utilisez `stock_xs`, `stock_s`, `stock_m`, `stock_l`, `stock_xl` et `stock_xxl`. Le stock total est calculé automatiquement.
- `image` accepte un fichier présent dans le ZIP ou une URL publique commençant par `https://`.

## Limites et sécurité

- 100 lignes par lot, CSV de 2 Mo maximum et ZIP de 100 Mo maximum.
- JPG, JPEG, PNG et WEBP uniquement, 10 Mo maximum par image.
- Les chemins ZIP dangereux et les noms ambigus sont refusés.
- Une erreur sur une ligne ne bloque pas les autres produits. Le rapport final doit être conservé jusqu'à vérification.
