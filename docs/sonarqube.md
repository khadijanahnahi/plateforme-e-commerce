# SonarQube et assurance du code IA

ShopSphere est un monorepo. Il utilise deux projets SonarQube Cloud afin que Maven
analyse correctement Java et que le scanner générique analyse React :

- `ShopSphere-Backend` pour `backend/` ;
- `ShopSphere-Frontend` pour `frontend/`.

Les analyses sont intégrées aux jobs existants de `.github/workflows/ci.yml`. Le
scanner attend le résultat du Quality Gate et retourne un code d'échec lorsque le
gate échoue. Aucun token Sonar ne doit être enregistré dans Git.

## Configuration GitHub

1. Importer le dépôt GitHub dans SonarQube Cloud et créer les deux projets du
   monorepo avec des clés distinctes.
2. Dans GitHub, ouvrir `Settings > Secrets and variables > Actions`.
3. Ajouter le secret `SONAR_TOKEN` généré par SonarQube Cloud.
4. Ajouter les variables suivantes :

| Variable | Exemple sans secret |
| --- | --- |
| `SONAR_ORGANIZATION` | clé de l'organisation Sonar |
| `SONAR_BACKEND_PROJECT_KEY` | clé du projet backend |
| `SONAR_FRONTEND_PROJECT_KEY` | clé du projet frontend |
| `SONAR_HOST_URL` | `https://sonarcloud.io` |

`SONAR_HOST_URL` est facultative pour SonarQube Cloud, car la CI utilise cette URL
par défaut. Pour SonarQube Server, l'instance doit être joignable depuis les runners
GitHub et la configuration `sonar.organization` doit être adaptée.

Les secrets GitHub Actions ne sont pas transmis aux pull requests provenant d'un
fork. Il ne faut pas remplacer `pull_request` par `pull_request_target` pour contourner
cette protection, car du code non fiable pourrait alors accéder au token Sonar. Une
contribution externe doit être reprise sur une branche approuvée avant analyse. Pour
les pull requests Dependabot, enregistrer également `SONAR_TOKEN` dans
`Settings > Secrets and variables > Dependabot` si leur analyse Sonar est requise.

## Quality Gate pour le code IA

Effectuer ces opérations sur les deux projets Sonar :

1. Ouvrir `Project Settings > AI Code Assurance`.
2. Marquer le projet comme contenant du code généré par IA.
3. Appliquer le gate intégré `Sonar way for AI Code`, ou un gate personnalisé
   qualifié pour AI Code Assurance.
4. Utiliser un profil de qualité strict pour Java, JavaScript, CSS et YAML.
5. Définir le nouveau code par rapport à la branche `main`.

Le gate recommandé contrôle notamment l'absence de nouveaux problèmes, la revue de
tous les nouveaux Security Hotspots, une couverture du nouveau code d'au moins 80 %
et moins de 3 % de duplication. Il ajoute également des contrôles de sécurité et de
fiabilité sur le code global.

L'autodétection Sonar concerne principalement l'usage de GitHub Copilot et ne prouve
pas l'origine de chaque ligne. Cette fonctionnalité est dépréciée par Sonar. Pour
Codex, ChatGPT et les autres assistants, le projet reste donc explicitement marqué
comme contenant du code IA et chaque pull request doit déclarer l'assistance utilisée.

## Protection de la branche principale

Dans `Settings > Branches > Branch protection rules` pour `main` :

- exiger une pull request avant fusion ;
- exiger au moins une approbation humaine ;
- invalider les approbations après un nouveau push ;
- exiger la résolution des conversations ;
- exiger les checks `AI contribution disclosure`, `Backend fast tests`,
  `Frontend build` et `Security scan` ;
- interdire le contournement des règles, y compris aux administrateurs si possible.

La décoration des pull requests doit être activée dans SonarQube Cloud. Une PR dont
le Quality Gate échoue ne doit pas être fusionnée.

## Première mise en service

La première analyse peut révéler une dette existante ou un manque de couverture,
notamment côté React où aucun framework de tests unitaires n'est encore configuré.
Ne pas réduire le Quality Gate pour rendre la CI verte. Ajouter progressivement des
tests ciblés et corriger les problèmes, en conservant les conditions strictes sur le
nouveau code.

Pour diagnostiquer une analyse :

1. ouvrir le job GitHub Actions concerné ;
2. ouvrir le lien Sonar affiché par le scanner ;
3. traiter d'abord les vulnérabilités, bugs, Security Hotspots et duplications du
   nouveau code ;
4. relancer le workflow après correction.
