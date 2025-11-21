# Intégration Taiga MCP Server avec n8n (Docker Compose)

Guide d'intégration du serveur Taiga MCP dans votre stack Docker existante avec n8n et Traefik.

## 📁 Structure des fichiers

```
~/ (racine de votre VPS)
├── docker-compose.yml         # Votre docker-compose principal
├── .env                        # Variables d'environnement
└── taigaMcpServer/            # Dossier du serveur Taiga MCP
    ├── Dockerfile
    ├── src/
    │   ├── index.js
    │   ├── httpServer.js
    │   └── ...
    └── package.json
```

## 🔧 Étape 1 : Ajouter le service au docker-compose.yml

Ajoutez ce service à votre fichier `~/docker-compose.yml` existant (après le service `n8n`) :

```yaml
  # Taiga MCP Server - HTTP/SSE mode for n8n integration
  taiga-mcp-http:
    build:
      context: ./taigaMcpServer
      dockerfile: Dockerfile
      target: production
    image: taiga-mcp-server:latest
    container_name: taiga-mcp-http
    restart: unless-stopped
    command: ["node", "src/httpServer.js"]
    environment:
      - NODE_ENV=production
      - TAIGA_API_URL=${TAIGA_API_URL:-https://api.taiga.io/api/v1}
      - TAIGA_USERNAME=${TAIGA_USERNAME}
      - TAIGA_PASSWORD=${TAIGA_PASSWORD}
      - MCP_HTTP_PORT=3000
      - MCP_HTTP_HOST=0.0.0.0
    # Internal access only - no port published to host
    expose:
      - "3000"
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: '0.5'
        reservations:
          memory: 128M
          cpus: '0.25'
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

## 🔐 Étape 2 : Ajouter les variables d'environnement

Ajoutez ces lignes à votre fichier `~/.env` :

```env
# Taiga MCP Server Configuration
TAIGA_API_URL=https://api.taiga.io/api/v1
TAIGA_USERNAME=votre_username_taiga
TAIGA_PASSWORD=votre_password_taiga
```

**⚠️ Sécurité :** Ne commitez JAMAIS le fichier `.env` sur Git !

## 🚀 Étape 3 : Déployer les services

```bash
# Depuis la racine de votre VPS (~/)
cd ~

# 1. Builder l'image Taiga MCP
docker-compose build taiga-mcp-http

# 2. Démarrer tous les services (ou seulement taiga-mcp-http)
docker-compose up -d taiga-mcp-http

# 3. Vérifier que le conteneur tourne
docker-compose ps

# 4. Vérifier les logs
docker-compose logs -f taiga-mcp-http
```

Vous devriez voir :
```
╔════════════════════════════════════════════════════════════╗
║         Taiga MCP Server - HTTP/SSE Mode                   ║
╠════════════════════════════════════════════════════════════╣
║  Server:    Taiga MCP                                     ║
║  Version:   1.9.14                                        ║
║  Transport: SSE (Server-Sent Events)                       ║
║  Listen:    http://0.0.0.0:3000                           ║
╚════════════════════════════════════════════════════════════╝
```

## ✅ Étape 4 : Tester la connexion

### Test depuis le host (VPS) :

```bash
# Test du health check
curl http://localhost:3000/health

# Résultat attendu :
{
  "status": "healthy",
  "server": "Taiga MCP",
  "version": "1.9.14",
  "transport": "sse",
  "timestamp": "..."
}
```

### Test depuis le conteneur n8n :

```bash
# Entrer dans le conteneur n8n
docker exec -it n8n sh

# Tester la connexion au serveur MCP
wget -qO- http://taiga-mcp-http:3000/health

# Ou avec curl (si disponible)
curl http://taiga-mcp-http:3000/health
```

## 🔌 Étape 5 : Configuration dans n8n

### 1. Dans votre workflow n8n, ajoutez un nœud **"MCP TAIGA API"**

### 2. Configurez le nœud avec ces paramètres :

| Paramètre | Valeur |
|-----------|--------|
| **Endpoint** | `http://taiga-mcp-http:3000/sse` |
| **Server Transport** | `Server Sent Events (Deprecated)` ou `HTTP Streamable` |
| **Tools to Include** | Laissez vide (tous les outils) |
| **Timeout** | `60000` (60 secondes) |

### 3. Cliquez sur "Execute step" pour tester

## 📊 Vérification et Monitoring

### Vérifier l'état des conteneurs :

```bash
docker-compose ps
```

Résultat attendu :
```
       Name                     Command               State           Ports
-----------------------------------------------------------------------------------
n8n                  ...                              Up      0.0.0.0:5678->5678/tcp
taiga-mcp-http       node src/httpServer.js           Up      3000/tcp
traefik              ...                              Up      0.0.0.0:80->80/tcp, ...
```

### Surveiller les logs en temps réel :

```bash
# Logs du serveur MCP
docker-compose logs -f taiga-mcp-http

# Logs de n8n
docker-compose logs -f n8n

# Logs de tous les services
docker-compose logs -f
```

### Vérifier l'utilisation des ressources :

```bash
docker stats taiga-mcp-http
```

## 🔧 Commandes utiles

### Redémarrer le serveur MCP :

```bash
docker-compose restart taiga-mcp-http
```

### Reconstruire l'image après modifications :

```bash
docker-compose build taiga-mcp-http
docker-compose up -d taiga-mcp-http
```

### Arrêter le serveur MCP :

```bash
docker-compose stop taiga-mcp-http
```

### Supprimer le conteneur :

```bash
docker-compose down taiga-mcp-http
```

## 🐛 Dépannage

### Problème : n8n ne peut pas se connecter à taiga-mcp-http

**Solution 1 :** Vérifier que les deux conteneurs sont sur le même réseau

```bash
# Inspecter le réseau de n8n
docker inspect n8n | grep NetworkMode

# Inspecter le réseau de taiga-mcp-http
docker inspect taiga-mcp-http | grep NetworkMode
```

Les deux doivent être sur le même réseau (probablement `root_default`).

**Solution 2 :** Tester la connectivité depuis n8n

```bash
docker exec -it n8n ping taiga-mcp-http
docker exec -it n8n wget -qO- http://taiga-mcp-http:3000/health
```

### Problème : Erreur d'authentification Taiga

**Solution :** Vérifier les credentials dans `.env`

```bash
# Tester l'authentification manuellement
curl -X POST https://api.taiga.io/api/v1/auth \
  -H "Content-Type: application/json" \
  -d '{
    "username":"VOTRE_USERNAME",
    "password":"VOTRE_PASSWORD",
    "type":"normal"
  }'
```

Si ça échoue, vérifiez vos identifiants Taiga.

### Problème : Le conteneur ne démarre pas

**Solution :** Vérifier les logs d'erreur

```bash
docker-compose logs taiga-mcp-http
```

Vérifier que le Dockerfile et les fichiers sources sont présents :

```bash
ls -la ~/taigaMcpServer/
ls -la ~/taigaMcpServer/src/
```

### Problème : Port 3000 déjà utilisé

Si vous voyez une erreur `port 3000 already in use`, c'est normal ! Le port n'est **pas** publié sur l'hôte, il est seulement exposé en interne entre conteneurs. C'est le comportement attendu avec `expose:` au lieu de `ports:`.

## 🔒 Sécurité

### Bonnes pratiques :

✅ **Le port 3000 n'est PAS exposé publiquement** (pas de `ports:` mapping)
✅ **Communication interne uniquement** via le réseau Docker
✅ **Credentials stockés dans .env** (non versionné)
✅ **Logs limités** (max 30MB par conteneur)
✅ **Limites de ressources** configurées

### ⚠️ À NE PAS FAIRE :

❌ Ne jamais exposer le port 3000 publiquement :
```yaml
# MAUVAIS - NE PAS FAIRE
ports:
  - "3000:3000"
```

❌ Ne jamais commiter le fichier `.env`

❌ Ne jamais hardcoder les credentials dans docker-compose.yml

## 📡 URL à utiliser dans n8n

| Depuis | URL |
|--------|-----|
| **n8n (même réseau Docker)** | `http://taiga-mcp-http:3000` |
| **Host (VPS)** | `http://localhost:3000` |
| **Autres conteneurs** | `http://taiga-mcp-http:3000` |

## 🎯 Test complet d'intégration

Créez ce workflow de test dans n8n :

1. **Nœud Start** (Manual trigger)
2. **Nœud HTTP Request**
   - Method: `GET`
   - URL: `http://taiga-mcp-http:3000/health`
3. **Nœud MCP TAIGA API**
   - Endpoint: `http://taiga-mcp-http:3000/sse`
   - Transport: `Server Sent Events`
   - Tool: `listProjects` (pour lister vos projets Taiga)

Exécutez le workflow. Le premier nœud devrait retourner le status "healthy", et le second devrait lister vos projets Taiga.

## 📚 Ressources supplémentaires

- Documentation complète : [HTTP_SETUP.md](./HTTP_SETUP.md)
- API Reference : Voir le wiki du projet
- n8n Documentation : https://docs.n8n.io/
- Taiga API : https://docs.taiga.io/api.html

## 🆘 Support

Si vous rencontrez des problèmes :

1. ✅ Vérifier les logs : `docker-compose logs -f taiga-mcp-http`
2. ✅ Tester le health check : `curl http://localhost:3000/health`
3. ✅ Vérifier la connectivité : `docker exec -it n8n wget -qO- http://taiga-mcp-http:3000/health`
4. ✅ Consulter la documentation [HTTP_SETUP.md](./HTTP_SETUP.md)
5. ✅ Ouvrir une issue sur GitHub avec les logs et la configuration

---

✨ **Vous êtes prêt !** Le serveur Taiga MCP est maintenant intégré dans votre stack Docker et accessible depuis n8n.
