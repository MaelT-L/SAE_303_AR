// ====================================================================
// 1. FONCTIONS UTILITAIRES (Scènes 3 et 5)
// ====================================================================

/**
 * Génère une "pluie" d'étudiants (Scène 3 - Animation de chute).
 * @param {string} containerId - Sélecteur du conteneur A-Frame (#container-beziers ou #container-montpellier).
 * @param {number} count - Nombre de modèles à générer.
 */
function lancerPluie(containerId, count) {
  var container = document.querySelector(containerId);
  if (!container) return;

  var fallDuration = 1500; 
  var spawnInterval = 150; 

  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      var el = document.createElement('a-gltf-model');
      el.setAttribute('src', '#student1');
      el.setAttribute('scale', '0.4 0.4 0.4');

      // Dispersion (moins large que l'original V1)
      var randomX = (Math.random() - 0.5) * 0.4;
      // Z : Toujours proche caméra
      var randomZ = 0.5 + (Math.random() * 0.7);
      // Y : Départ
      var startY = 1.5;

      el.setAttribute('position', {x: randomX, y: startY, z: randomZ});

      // Animation de chute
      el.setAttribute('animation', {
        property: 'position',
        to: `${randomX} -1.5 ${randomZ}`,
        dur: fallDuration,
        easing: 'linear'
      });
      
      el.setAttribute('rotation', `${Math.random() * 360} ${Math.random() * 360} 0`);

      container.appendChild(el);

      // Suppression auto après la chute
      setTimeout(() => {
        if (el.parentNode) {
            el.parentNode.removeChild(el);
        }
      }, fallDuration); 

    }, i * spawnInterval);
  }
}

/**
 * Nettoie la scène 3 de tous les modèles générés par lancerPluie.
 */
function nettoyerPluie() {
  var containers = ['#container-beziers', '#container-montpellier'];
  containers.forEach(id => {
    var c = document.querySelector(id);
    if (c) {
      // Nettoie uniquement les modèles 3D générés
      while (c.firstChild) {
        c.removeChild(c.firstChild);
      }
    }
  });
}

/**
 * Fonction pour éparpiller les étudiants (Scène 5 - Nuage plat, position haute).
 * @param {object} container - Le conteneur A-Frame où ajouter les modèles.
 * @param {number} count - Nombre de modèles à générer.
 * @param {number} side - -1 pour gauche (Béziers), 1 pour droite (Montpellier).
 */
function creerNuageEtudiants(container, count, side) {
  for (let i = 0; i < count; i++) {
    const student = document.createElement('a-gltf-model');
    // Sélectionne aléatoirement student1 ou student2
    const model = Math.random() > 0.5 ? '#student1' : '#student2';
    student.setAttribute('src', model);
    
    // Taille
    const scale = 0.15 + Math.random() * 0.05;
    student.setAttribute('scale', `${scale} ${scale} ${scale}`);
    
    // Positionnement
    const finalZ = 0.3; // Profondeur (Même Plan)
    const centerX = side * 0.6;
    const spreadX = 0.6; 
    const finalX = centerX + (Math.random() - 0.5) * spreadX;
    // Y (Hauteur) : Ajusté pour éviter le texte central
    const minY = -0.2; 
    const maxY = 0.25;
    const finalY = minY + Math.random() * (maxY - minY);

    // Position de départ (pour l'animation d'arrivée)
    const animStartX = side === -1 ? finalX - 2 : finalX + 2;

    student.setAttribute('position', `${animStartX} ${finalY} ${finalZ}`);
    
    // Rotation
    const randomRot = (Math.random() * 60) - 30; 
    student.setAttribute('rotation', `0 ${randomRot} 0`);

    // Animation d'arrivée latérale
    const delay = Math.random() * 1000;
    student.setAttribute('animation', `property: position; from: ${animStartX} ${finalY} ${finalZ}; to: ${finalX} ${finalY} ${finalZ}; dur: 1200; easing: easeOutBack; delay: ${delay}`);

    container.appendChild(student);
  }
}

/**
 * Réinitialise l'état initial de la Scène 5 (Diplômes).
 */
function resetScene5() {
  const scene5 = document.querySelector('#sous-scene-5');
  if (!scene5) return;

  // 1. Rendre les diplômes à nouveau cliquables et visibles
  const diplomes = scene5.querySelectorAll('[diplome-clickable]');
  diplomes.forEach(d => {
    d.setAttribute('visible', true);
    d.classList.add('clickable');
  });

  // 2. Masquer et nettoyer les éléments dynamiques
  const texteInfo = scene5.querySelector('#texte-info-central');
  const containerBeziersStudents = scene5.querySelector('#container-beziers-students');
  const containerMontpellierStudents = scene5.querySelector('#container-montpellier-students');
  const btnRetourDiplomes = scene5.querySelector('#btn-retour-diplomes');

  if (texteInfo) texteInfo.setAttribute('visible', false);
  // NOTE: On ne nettoie pas les enfants des conteneurs étudiants ici car on les recrée
  // et nettoie dans afficherDetailsScene5, mais on les masque pour être sûr.
  if (containerBeziersStudents) containerBeziersStudents.setAttribute('visible', false);
  if (containerMontpellierStudents) containerMontpellierStudents.setAttribute('visible', false);

  if (btnRetourDiplomes) {
    btnRetourDiplomes.setAttribute('visible', false);
    btnRetourDiplomes.classList.remove('clickable');
  }
}


// ====================================================================
// 2. NOUVEAU COMPOSANT A-FRAME (Scène 5 : Diplômes)
// ====================================================================

AFRAME.registerComponent('diplome-clickable', {
  schema: {
    ville: { type: 'string', default: 'beziers' }, // Non utilisé dans la logique actuelle, mais conservé
    index: { type: 'number', default: 0 }, // 0=EN, 1=ETAT, 2=RNCP
    image: { type: 'string', default: '#text5-1' } // Source de l'image du titre
  },
  init: function () {
    this.el.classList.add('clickable');
    
    // Stocker la scale initiale pour les animations de survol
    this.el.addEventListener('loaded', () => { this.initialScale = this.el.object3D.scale.clone(); });
    if (this.el.hasLoaded) { this.initialScale = this.el.object3D.scale.clone(); }

    // Effet de survol
    this.el.addEventListener('mouseenter', () => {
      if (this.initialScale) {
        this.el.setAttribute('scale', {
            x: this.initialScale.x * 1.2, y: this.initialScale.y * 1.2, z: this.initialScale.z * 1.2
        });
      }
    });
    
    this.el.addEventListener('mouseleave', () => {
      if (this.initialScale) {
        this.el.setAttribute('scale', this.initialScale);
      }
    });

    // Action au clic
    this.el.addEventListener('click', () => {
      this.afficherDetailsScene5();
    });
  },

  afficherDetailsScene5: function () {
    const scene5 = document.querySelector('#sous-scene-5');
    const index = this.data.index; 
    
    // Masquer les diplômes
    const diplomes = scene5.querySelectorAll('[diplome-clickable]');
    diplomes.forEach(d => {
      d.setAttribute('visible', false);
      d.classList.remove('clickable');
    });

    // --- GESTION DES IMAGES (Titre et Stats) ---
    let texteInfo = scene5.querySelector('#texte-info-central');
    if (!texteInfo) {
      texteInfo = document.createElement('a-entity');
      texteInfo.setAttribute('id', 'texte-info-central');
      texteInfo.setAttribute('position', '0 0 0'); 
      scene5.appendChild(texteInfo);
    } else {
      texteInfo.setAttribute('visible', true);
      // Nettoyage des images précédentes
      while (texteInfo.firstChild) { texteInfo.removeChild(texteInfo.firstChild); }
    }

    // 1. Image principale (TITRE)
    const imageTitle = document.createElement('a-image');
    imageTitle.setAttribute('src', this.data.image);
    imageTitle.setAttribute('scale', '0.5 0.15 1'); 
    imageTitle.setAttribute('position', '0 0.5 0.4'); 
    imageTitle.setAttribute('opacity', '0');
    imageTitle.setAttribute('animation', 'property: opacity; from: 0; to: 1; dur: 1000; easing: easeInOutQuad');
    texteInfo.appendChild(imageTitle);

    // 2. Sélection des sources d'images STATS
    let srcBeziers = '';
    let srcMontpellier = '';
    
    if (index === 0) { // Haut (EN)
        srcBeziers = '#text5-6';
        srcMontpellier = '#text5-9';
    } else if (index === 1) { // Milieu (ETAT)
        srcBeziers = '#text5-5';
        srcMontpellier = '#text5-8';
    } else if (index === 2) { // Bas (RNCP)
        srcBeziers = '#text5-4';
        srcMontpellier = '#text5-7';
    }

    // 3. Image Stats BÉZIERS (Bas Gauche)
    const imageStatsBeziers = document.createElement('a-image');
    imageStatsBeziers.setAttribute('src', srcBeziers);
    imageStatsBeziers.setAttribute('scale', '0.5 0.15 1'); 
    imageStatsBeziers.setAttribute('position', '-0.5 -0.4 0.4'); 
    imageStatsBeziers.setAttribute('opacity', '0');
    imageStatsBeziers.setAttribute('animation', 'property: opacity; from: 0; to: 1; dur: 1000; easing: easeInOutQuad; delay: 200');
    texteInfo.appendChild(imageStatsBeziers);

    // 4. Image Stats MONTPELLIER (Bas Droite)
    const imageStatsMontpellier = document.createElement('a-image');
    imageStatsMontpellier.setAttribute('src', srcMontpellier);
    imageStatsMontpellier.setAttribute('scale', '0.5 0.15 1'); 
    imageStatsMontpellier.setAttribute('position', '0.5 -0.4 0.4'); 
    imageStatsMontpellier.setAttribute('opacity', '0');
    imageStatsMontpellier.setAttribute('animation', 'property: opacity; from: 0; to: 1; dur: 1000; easing: easeInOutQuad; delay: 200');
    texteInfo.appendChild(imageStatsMontpellier);


    // --- STATISTIQUES (Nombres d'étudiants) ---
    let countBeziers = 0;
    let countMontpellier = 0;

    if (index === 0) { // EN
        countBeziers = 7;
        countMontpellier = 35;
    } else if (index === 1) { // ETAT
        countBeziers = 4;
        countMontpellier = 15;
    } else if (index === 2) { // RNCP
        countBeziers = 2;
        countMontpellier = 10;
    }

    // Gestion des conteneurs étudiants
    let containerBeziersStudents = scene5.querySelector('#container-beziers-students');
    let containerMontpellierStudents = scene5.querySelector('#container-montpellier-students');

    // Nettoyer et recréer les conteneurs pour s'assurer qu'ils sont vides
    if (containerBeziersStudents) scene5.removeChild(containerBeziersStudents);
    if (containerMontpellierStudents) scene5.removeChild(containerMontpellierStudents);

    containerBeziersStudents = document.createElement('a-entity');
    containerBeziersStudents.setAttribute('id', 'container-beziers-students');
    containerBeziersStudents.setAttribute('position', '0 0 0'); 
    scene5.appendChild(containerBeziersStudents);

    containerMontpellierStudents = document.createElement('a-entity');
    containerMontpellierStudents.setAttribute('id', 'container-montpellier-students');
    containerMontpellierStudents.setAttribute('position', '0 0 0');
    scene5.appendChild(containerMontpellierStudents);

    // Générer les nuages d'étudiants
    creerNuageEtudiants(containerBeziersStudents, countBeziers, -1);
    creerNuageEtudiants(containerMontpellierStudents, countMontpellier, 1);

    // Bouton retour interne
    let btnRetourDiplomes = scene5.querySelector('#btn-retour-diplomes');
    if (!btnRetourDiplomes) {
      btnRetourDiplomes = document.createElement('a-image');
      btnRetourDiplomes.setAttribute('id', 'btn-retour-diplomes');
      // L'image doit être définie dans les assets A-Frame ou être une URL
      btnRetourDiplomes.setAttribute('src', 'https://cdn-icons-png.flaticon.com/512/93/93634.png'); 
      btnRetourDiplomes.setAttribute('position', '0.7 0.65 0.1');
      btnRetourDiplomes.setAttribute('scale', '0.1 0.1 0.1');
      btnRetourDiplomes.classList.add('clickable');
      scene5.appendChild(btnRetourDiplomes);
      // Événement de retour
      btnRetourDiplomes.addEventListener('click', () => { resetScene5(); });
    } else {
      btnRetourDiplomes.setAttribute('visible', true);
      btnRetourDiplomes.classList.add('clickable');
    }
  }
});


// ====================================================================
// 3. COMPOSANT PRINCIPAL (GESTION DES SCÈNES)
// ====================================================================

AFRAME.registerComponent('gestion-scene', {
  schema: {
    target: {type: 'string', default: ''}, // Scène à ouvrir (ex: '#sous-scene-2')
    action: {type: 'string', default: 'open'} // 'open' ou 'close'
  },
  init: function () {
    var data = this.data;
    var el = this.el;

    el.addEventListener('click', function () {
      if (data.action === 'open') {
        var menu = document.querySelector('#menu-principal');
        if (menu) {
          // Masquer le menu
          menu.setAttribute('visible', 'false');
          menu.querySelectorAll('.clickable').forEach(item => item.classList.remove('clickable'));
        }

        var targetScene = document.querySelector(data.target);
        if (targetScene) targetScene.setAttribute('visible', 'true');

        // Rendre le bouton de retour de la scène cible cliquable
        var btn = targetScene ? targetScene.querySelector('.bouton-retour') : null;
        if (btn) btn.classList.add('clickable');

        // --- GESTION DES DÉCLENCHEURS PAR SCÈNE ---

        // SCENE 2 : Animation flèches (Événement 'showscene')
        if (data.target === '#sous-scene-2') {
          setTimeout(() => {
            if (targetScene.getAttribute('visible') === true || targetScene.getAttribute('visible') === 'true') {
              // Émet l'événement pour les modèles 3D et les images de texte
              targetScene.querySelectorAll('a-gltf-model, a-entity a-image').forEach(el => {
                el.emit('showscene');
              });
            }
          }, 50); 
        }

        // SCENE 4 : Rotation étudiants (Événement 'showscene-4')
        if (data.target === '#sous-scene-4') {
          setTimeout(() => {
            if (targetScene.getAttribute('visible') === true || targetScene.getAttribute('visible') === 'true') {
              // Émet l'événement pour déclencher la rotation
              targetScene.querySelectorAll('.student-rotator').forEach(el => {
                el.emit('showscene-4');
              });
            }
          }, 50); 
        }

        // SCENE 3 : Pluie d'étudiants
        if (data.target === '#sous-scene-3') {
          setTimeout(() => {
            if (targetScene.getAttribute('visible') === true || targetScene.getAttribute('visible') === 'true') {
              lancerPluie('#container-beziers', 50);
              lancerPluie('#container-montpellier', 10);
            }
          }, 1500);
        }
        
        // SCENE 5 : Diplômes (Aucun déclenchement ici, car les éléments sont cliquables par défaut)
        
      } 
      else if (data.action === 'close') {
        var currentScene = el.parentEl;
        if (currentScene) currentScene.setAttribute('visible', 'false');
        // Rendre le bouton de retour inactif
        el.classList.remove('clickable');

        // --- NETTOYAGE PAR SCÈNE ---

        // Nettoyage SCENE 3
        if (currentScene.id === 'sous-scene-3') {
          nettoyerPluie();
        }
        
        // Nettoyage SCENE 5
        if (currentScene.id === 'sous-scene-5') {
          resetScene5();
        }
        
        // Réafficher le menu principal
        var menu = document.querySelector('#menu-principal');
        if (menu) menu.setAttribute('visible', 'true');
        // Rendre les boutons du menu cliquables
        if (menu) menu.querySelectorAll('.image-menu').forEach(item => item.classList.add('clickable'));
      }
    });

    // --- EFFETS DE SURVOL DU BOUTON/IMAGE CLIQUEUR ---
    el.addEventListener('mouseenter', function () {
      var s = el.object3D.scale;
      el.setAttribute('scale', {x: s.x * 1.05, y: s.y * 1.1, z: s.z / 1.1});
    });
    el.addEventListener('mouseleave', function () {
      var s = el.object3D.scale;
      el.setAttribute('scale', {x: s.x / 1.05, y: s.y / 1.1, z: s.z * 1.1});
    });
  }
});