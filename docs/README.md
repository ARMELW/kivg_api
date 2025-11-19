# Documentation API

## Guides d'intégration disponibles

### 📢 [Upload Audio - Guide d'intégration](./AUDIO_UPLOAD_INTEGRATION.md)
Guide complet pour intégrer l'upload audio dans votre application cliente.

**Contenu:**
- Endpoints API disponibles
- Exemples d'intégration pour JavaScript/React/Vue.js/Angular
- Gestion des erreurs
- Bonnes pratiques
- Configuration environnement

**URL retournée:** URL complète et permanente (`http://localhost:9000/audio/audio/{fichier}.mp3`)

**Exemple de test:** [Interface de test HTML](./examples/audio-upload-test.html) - Ouvrir ce fichier dans un navigateur pour tester l'upload d'audio

---

## Fichiers d'exemple

### [audio-upload-test.html](./examples/audio-upload-test.html)
Interface HTML standalone pour tester l'API d'upload audio sans framework.
- Upload de fichiers audio avec barre de progression
- Affichage de l'URL complète retournée
- Lecteur audio intégré pour tester le fichier uploadé
- Gestion des erreurs et validation

**Utilisation:**
1. Ouvrir le fichier dans un navigateur
2. Entrer votre token JWT (sera sauvegardé dans localStorage)
3. Sélectionner un fichier audio
4. Cliquer sur "Uploader l'audio"
5. L'URL permanente sera affichée et le fichier sera jouable directement

---

## Autres ressources

- **API Documentation**: Disponible à `/docs` quand le serveur est lancé
- **Swagger**: Disponible à `/swagger` pour l'API interactive
