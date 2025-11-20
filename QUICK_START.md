# ⚡ Guide de Démarrage Rapide - Taiga MCP + n8n

## 🎯 Objectif

Installer le serveur Taiga MCP sur votre VPS avec Docker et le connecter à n8n pour automatiser vos workflows Taiga.

## 📦 Ce qui a été créé

### Architecture Monorepo (Option 4 - Bibliothèque Partagée)

```
📁 taigaMcpServer/
├── 📦 packages/
│   ├── taiga-core/          ⭐ Bibliothèque TypeScript partagée
│   ├── taiga-mcp-server/    🔌 Interface MCP (pour Claude Desktop)
│   └── taiga-rest-api/      🌐 Interface HTTP REST (pour n8n)
├── 🐳 docker-compose.yml    Orchestration Docker
├── 🐳 Dockerfile.rest-api   Build API REST
└── 📖 README_DOCKER_N8N.md  Documentation complète
```

## 🚀 Installation en 5 minutes

### 1. Créer le fichier `.env`

```bash
cd /home/user/taigaMcpServer
cp .env.example .env
nano .env
```

Modifier avec vos vraies valeurs :

```env
TAIGA_API_URL=https://api.taiga.io/api/v1
TAIGA_USERNAME=votre_username_taiga
TAIGA_PASSWORD=votre_password_taiga

N8N_USER=admin
N8N_PASSWORD=un_mot_de_passe_securise
```

### 2. Construire et démarrer

```bash
# Build et lancement des services
docker-compose up -d --build

# Vérifier que tout fonctionne
docker-compose ps
```

Vous devriez voir :

```
NAME                 STATUS
taiga-rest-api       Up (healthy)
n8n                  Up (healthy)
```

### 3. Tester l'API

```bash
# Health check
curl http://localhost:3000/health

# Obtenir votre API key
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"votre_username","password":"votre_password"}'

# Réponse (gardez l'apiKey !) :
# {
#   "success": true,
#   "apiKey": "dXNlcm5hbWU6cGFzc3dvcmQ=",
#   ...
# }

# Lister vos projets
curl -H "X-API-Key: VOTRE_API_KEY" \
  http://localhost:3000/api/projects
```

### 4. Accéder à n8n

1. Ouvrir `http://your-vps-ip:5678` dans votre navigateur
2. Se connecter avec `N8N_USER` et `N8N_PASSWORD` configurés dans `.env`

### 5. Créer votre premier workflow n8n

#### Workflow : "Liste mes projets Taiga"

1. **Créer un nouveau workflow**

2. **Ajouter un node "HTTP Request"**
   - Method: `GET`
   - URL: `http://taiga-rest-api:3000/api/projects`
     - ⚠️ Utiliser `taiga-rest-api` (nom du service Docker) et NON `localhost`
   - Authentication: `None` (on utilise un header custom)
   - Options > Add Option > "Headers"
     - Name: `X-API-Key`
     - Value: `votre_api_key_obtenue_precedemment`

3. **Exécuter le node**
   - Cliquer sur "Execute Node"
   - Vous devriez voir vos projets Taiga ! 🎉

#### Workflow : "Créer une issue automatiquement"

1. **Add Schedule Trigger** (optionnel)
   - Pour exécuter automatiquement

2. **Add HTTP Request**
   - Method: `POST`
   - URL: `http://taiga-rest-api:3000/api/issues`
   - Authentication: Header avec `X-API-Key`
   - Body Content Type: `JSON`
   - Specify Body: `Using JSON`
   - JSON/RAW Parameters:
     ```json
     {
       "project": 123,
       "subject": "Issue créée depuis n8n",
       "description": "Automatisation réussie !",
       "priority": 1,
       "severity": 1,
       "type": 1
     }
     ```

3. **Remplacer** `123` par l'ID de votre projet (obtenu du workflow précédent)

4. **Execute Node** - L'issue devrait être créée dans Taiga ! ✨

## 📚 Endpoints principaux

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Authentification |
| `/api/projects` | GET | Liste projets |
| `/api/projects/:id` | GET | Détails projet |
| `/api/sprints?project_id=X` | GET | Liste sprints |
| `/api/issues?project_id=X` | GET | Liste issues |
| `/api/issues` | POST | Créer issue |
| `/api/user-stories?project_id=X` | GET | Liste user stories |
| `/api/tasks` | POST | Créer tâche |

📖 **Documentation complète** : `http://your-vps-ip:3000/api-docs`

## 🔍 Vérifications

### Services en cours d'exécution

```bash
docker-compose ps
```

### Logs

```bash
# Tous les logs
docker-compose logs -f

# Seulement l'API REST
docker-compose logs -f taiga-rest-api

# Seulement n8n
docker-compose logs -f n8n
```

### Résolution de problèmes

#### "Cannot connect to taiga-rest-api"

- ✅ Vérifier que les services sont sur le même réseau Docker
- ✅ Utiliser `http://taiga-rest-api:3000` dans n8n (PAS `localhost`)
- ✅ Vérifier les logs : `docker-compose logs taiga-rest-api`

#### "Authentication failed"

- ✅ Vérifier `.env` : `cat .env`
- ✅ Tester manuellement : `curl -X POST http://localhost:3000/api/auth/login ...`

#### "Port already in use"

```bash
# Vérifier quel processus utilise le port 3000
sudo netstat -tulpn | grep 3000

# Modifier le port dans docker-compose.yml si nécessaire
# Changer "3000:3000" vers "3001:3000"
```

## 🎉 Prochaines étapes

1. **Explorer la documentation Swagger** : `http://your-vps-ip:3000/api-docs`
2. **Lire le guide complet** : `README_DOCKER_N8N.md`
3. **Créer des workflows avancés** avec n8n
4. **Sécuriser avec HTTPS** (Nginx + Let's Encrypt)

## 💡 Exemples de workflows n8n

### Automatiser la création de sprints mensuels

1. **Schedule Trigger** - 1er de chaque mois
2. **HTTP Request** - POST `/api/sprints`
3. **Slack/Email** - Notification de confirmation

### Synchroniser GitHub Issues → Taiga

1. **GitHub Trigger** - Nouvelle issue créée
2. **HTTP Request** - POST `/api/issues` avec les données GitHub
3. **GitHub Comment** - Ajouter un lien vers Taiga

### Dashboard temps réel

1. **Schedule** - Toutes les heures
2. **HTTP Request** - GET `/api/sprints/:id/stats`
3. **Google Sheets** - Mise à jour du dashboard

## 🆘 Besoin d'aide ?

- **Documentation complète** : `README_DOCKER_N8N.md`
- **Issues GitHub** : https://github.com/greddy7574/taigaMcpServer/issues
- **Documentation Taiga** : https://docs.taiga.io
- **Documentation n8n** : https://docs.n8n.io

---

**🎯 Objectif atteint ! Votre serveur Taiga MCP est maintenant accessible depuis n8n !**

_Développé avec l'Option 4 (Bibliothèque partagée) - Architecture modulaire et réutilisable_
